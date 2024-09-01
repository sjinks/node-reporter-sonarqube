import { type TestEvent } from 'node:test/reporters';
import { tag } from './utils.mjs';

interface TestInfo {
    name: string;
    duration: number;
    status: 'pass' | 'fail' | 'skip';
}

const getFilename = (file: string | undefined): string => file ?? '-';

function handleEvent(event: TestEvent, testName: string[], tests: Record<string, TestInfo[]>): void {
    switch (event.type) {
        case 'test:start': {
            const { file, name, nesting } = event.data;
            while (testName.length > nesting) {
                testName.pop();
            }

            testName.push(name);

            const fname = getFilename(file);
            if (tests[fname] === undefined) {
                tests[fname] = [];
            }

            break;
        }

        case 'test:pass':
        case 'test:fail':
            if (event.data.details.type !== 'suite') {
                const file = getFilename(event.data.file);
                const duration = event.data.details.duration_ms;
                let status: TestInfo['status'];
                if (event.type === 'test:fail') {
                    status = 'fail';
                } else if (event.data.todo || event.data.skip) {
                    status = 'skip';
                } else {
                    status = 'pass';
                }

                tests[file]!.push({ name: testName.join(' » '), duration, status });
            }

            break;

        default:
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
        for (const { name, duration, status } of testCases) {
            let inner: string | undefined;

            if (status === 'fail') {
                inner = tag('failure');
            } else if (status === 'skip') {
                inner = tag('skipped');
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
