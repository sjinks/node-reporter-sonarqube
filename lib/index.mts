import { type EventData } from 'node:test';
import { type TestEvent } from 'node:test/reporters';
import { getFilename, tag } from './utils.mjs';

interface TestInfo {
    name: string;
    duration: number;
    status: 'pass' | 'fail' | 'skip';
    message?: string;
}

function handleTestStart(data: EventData.TestStart, testName: string[], tests: Record<string, TestInfo[]>): void {
    const { file, name, nesting } = data;
    while (testName.length > nesting) {
        testName.pop();
    }

    testName.push(name);

    const fname = getFilename(file);
    tests[fname] ??= [];
}

function handleTestFailure(data: EventData.TestFail, testName: string[], tests: Record<string, TestInfo[]>): void {
    if (data.details.type !== 'suite') {
        const file = getFilename(data.file);
        const duration = data.details.duration_ms;
        const status = 'fail';
        const message = data.details.error.toString() || '<test failed>';
        tests[file]!.push({ name: testName.join(' » '), duration, status, message });
    }
}

function handleTestPass(data: EventData.TestPass, testName: string[], tests: Record<string, TestInfo[]>): void {
    if (data.details.type !== 'suite') {
        const file = getFilename(data.file);
        const duration = data.details.duration_ms;
        let message: string | undefined;
        let status: TestInfo['status'];

        if (data.todo) {
            status = 'skip';
            message = typeof data.todo === 'string' ? data.todo : '<TODO>';
        } else if (data.skip) {
            status = 'skip';
            message = typeof data.skip === 'string' ? data.skip : '<SKIP>';
        } else {
            status = 'pass';
        }

        tests[file]!.push({ name: testName.join(' » '), duration, status, message });
    }
}

function handleEvent(event: TestEvent, testName: string[], tests: Record<string, TestInfo[]>): void {
    // eslint-disable-next-line default-case
    switch (event.type) {
        case 'test:start':
            handleTestStart(event.data, testName, tests);
            break;

        case 'test:fail':
            handleTestFailure(event.data, testName, tests);
            break;

        case 'test:pass':
            handleTestPass(event.data, testName, tests);
            break;
    }
}

export default async function* sonarQubeReporter(
    source: AsyncGenerator<TestEvent, void>,
): AsyncGenerator<string, void> {
    const testName: string[] = [];
    const tests: Record<string, TestInfo[]> = {};

    yield '<?xml version="1.0" encoding="UTF-8"?>\n';
    yield `${tag('testExecutions', { version: '1' }, false)}\n`;

    for await (const event of source) {
        handleEvent(event, testName, tests);
    }

    for (const [file, testCases] of Object.entries(tests)) {
        yield `\t${tag('file', { path: file }, false)}\n`;
        for (const { name, duration, status, message } of testCases) {
            let inner: string | undefined;

            if (status === 'fail') {
                inner = tag('failure', { message: message! });
            } else if (status === 'skip') {
                inner = tag('skipped', { message: message! });
            }

            const attrs = {
                name,
                duration: duration.toFixed(),
            };

            yield `\t\t${tag('testCase', attrs, !inner, inner)}\n`;
        }

        yield '\t</file>\n';
    }

    yield '</testExecutions>\n';
}
