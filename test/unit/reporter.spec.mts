import { deepEqual } from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { TestEvent } from 'node:test/reporters';
import sonarReporter from '../../lib/index.mjs';

const queue: TestEvent[] = [
    {
        type: 'test:start',
        data: {
            nesting: 0,
            name: 'Sample test suite',
            line: 3,
            column: 6,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:start',
        data: {
            nesting: 1,
            name: 'will generate a report entry on failure',
            line: 4,
            column: 10,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:fail',
        data: {
            name: 'will generate a report entry on failure',
            nesting: 1,
            testNumber: 1,
            details: {
                duration_ms: 1.522999,
                error: new Error('Expected 2 to equal 1') as TestError,
            },
            line: 4,
            column: 10,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:start',
        data: {
            nesting: 1,
            name: 'will not generate anything',
            line: 5,
            column: 10,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:pass',
        data: {
            name: 'will not generate anything',
            nesting: 1,
            testNumber: 2,
            details: { duration_ms: 0.081786 },
            line: 5,
            column: 10,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:start',
        data: {
            nesting: 1,
            name: 'Nested test suite',
            line: 6,
            column: 10,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:start',
        data: {
            nesting: 2,
            name: 'will be skipped',
            line: 7,
            column: 14,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:pass',
        data: {
            name: 'will be skipped',
            nesting: 2,
            testNumber: 1,
            details: { duration_ms: 0.115159 },
            line: 7,
            column: 14,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
            skip: 'This test is skipped',
        },
    },
    {
        type: 'test:start',
        data: {
            nesting: 2,
            name: 'todo test',
            line: 8,
            column: 14,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:pass',
        data: {
            name: 'todo test',
            nesting: 2,
            testNumber: 2,
            details: { duration_ms: 0.06991 },
            line: 8,
            column: 14,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
            todo: 'Implement me',
        },
    },
    {
        type: 'test:pass',
        data: {
            name: 'Nested test suite',
            nesting: 1,
            testNumber: 3,
            details: { duration_ms: 0.303933, type: 'suite' },
            line: 6,
            column: 10,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:fail',
        data: {
            name: 'Sample test suite',
            nesting: 0,
            testNumber: 1,
            details: {
                duration_ms: 2.418505,
                type: 'suite',
                error: new Error('1 subtest failed') as TestError,
            },
            line: 3,
            column: 6,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:start',
        data: {
            nesting: 0,
            name: 'top level test 1',
            line: 11,
            column: 6,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:pass',
        data: {
            name: 'top level test 1',
            nesting: 0,
            testNumber: 2,
            details: { duration_ms: 0.052553 },
            line: 11,
            column: 6,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:start',
        data: {
            nesting: 0,
            name: 'top level test 2',
            line: 12,
            column: 6,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
    {
        type: 'test:pass',
        data: {
            name: 'top level test 2',
            nesting: 0,
            testNumber: 3,
            details: { duration_ms: 0.055445 },
            line: 12,
            column: 6,
            file: 'node-reporter-sonarqube/test/integration/test.mts',
        },
    },
];

// eslint-disable-next-line @typescript-eslint/require-await
async function* generator(): AsyncGenerator<TestEvent, void> {
    for (const event of queue) {
        yield event;
    }
}

await describe('reporter', async () => {
    await test('will produce a report', async () => {
        const expected = [
            '<?xml version="1.0" encoding="UTF-8"?>\n',
            '<testExecutions version="1">\n',
            '\t<file path="node-reporter-sonarqube/test/integration/test.mts">\n',
            '\t\t<testCase name="Sample test suite » will generate a report entry on failure" duration="2"><failure/></testCase>\n',
            '\t\t<testCase name="Sample test suite » will not generate anything" duration="0"/>\n',
            '\t\t<testCase name="Sample test suite » Nested test suite » will be skipped" duration="0"><skipped/></testCase>\n',
            '\t\t<testCase name="Sample test suite » Nested test suite » todo test" duration="0"><skipped/></testCase>\n',
            '\t\t<testCase name="top level test 1" duration="0"/>\n',
            '\t\t<testCase name="top level test 2" duration="0"/>\n',
            '\t</file>\n',
            '</testExecutions>\n',
        ];

        const actual: string[] = [];
        for await (const line of sonarReporter(generator())) {
            actual.push(line);
        }

        deepEqual(actual, expected);
    });
});
