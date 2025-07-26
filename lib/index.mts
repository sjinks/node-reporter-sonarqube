import { type TestEvent } from 'node:test/reporters';
import { getFilename, tag } from './utils.mjs';

interface TestInfo {
    name: string;
    duration: number;
    status: 'pass' | 'fail' | 'skip';
    message?: string;
}

function handleEvent(event: TestEvent, testName: string[], tests: Record<string, TestInfo[]>): void {
    // eslint-disable-next-line default-case
    switch (event.type) {
        case 'test:start': {
            const { file, name, nesting } = event.data;
            while (testName.length > nesting) {
                testName.pop();
            }

            testName.push(name);

            const fname = getFilename(file);
            tests[fname] ??= [];
            break;
        }

        case 'test:pass':
        case 'test:fail':
            if (event.data.details.type !== 'suite') {
                const file = getFilename(event.data.file);
                const duration = event.data.details.duration_ms;
                let message: string | undefined;
                let status: TestInfo['status'];
                if (event.type === 'test:fail') {
                    status = 'fail';
                    message = event.data.details.error.toString() || '<test failed>';
                } else if (event.data.todo || event.data.skip) {
                    status = 'skip';
                    if (event.data.todo !== undefined) {
                        message = typeof event.data.todo === 'string' ? event.data.todo : '<TODO>';
                    } else {
                        message = typeof event.data.skip === 'string' ? event.data.skip : '<SKIP>';
                    }
                } else {
                    status = 'pass';
                }

                tests[file]!.push({ name: testName.join(' » '), duration, status, message });
            }

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
