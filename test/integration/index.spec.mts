import { equal, match } from 'node:assert/strict';
import { describe, it, run } from 'node:test';
import { WritableBufferStream } from '@myrotvorets/buffer-stream';
import { dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sonarReporter from '../../lib/index.mjs';

const runner = (files: string[]): Promise<string> =>
    new Promise<string>((resolve, reject) => {
        const outStream = new WritableBufferStream();
        run({ files })
            .on('error', reject)
            .compose(sonarReporter)
            .on('end', function () {
                resolve(outStream.toString());
            })
            .pipe(outStream);
    });

void describe('SonarQube Reporter', () => {
    void it('will generate a report entry on failure', async () => {
        const thisDir = dirname(fileURLToPath(import.meta.url));
        const result = await runner([`${thisDir}/test${extname(fileURLToPath(import.meta.url))}`]);
        const lines = result.trim().split('\n');

        const expected: (string | RegExp)[] = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<testExecutions version="1">',
            /^\t<file path="test\/integration\/test\.m.s">$/u,
            /^\t\t<testCase name="Sample test suite » will generate a report entry on failure" duration="\d+"><failure\/><\/testCase>$/u,
            /^\t\t<testCase name="Sample test suite » will not generate anything" duration="\d+"\/>/u,
            /^\t\t<testCase name="Sample test suite » Nested test suite » will be skipped" duration="\d+"><skipped\/><\/testCase>/u,
            /^\t\t<testCase name="Sample test suite » Nested test suite » todo test" duration="\d+"><skipped\/><\/testCase>/u,
            /^\t\t<testCase name="top level test 1" duration="\d+"\/>/u,
            /^\t\t<testCase name="top level test 2" duration="\d+"\/>/u,
            '\t</file>',
            '</testExecutions>',
        ];

        equal(lines.length, expected.length);
        for (let i = 0; i < lines.length; i++) {
            const pattern = expected[i];
            const line = lines[i];
            if (pattern instanceof RegExp) {
                match(line!, pattern);
            } else {
                equal(line, pattern);
            }
        }
    });
});
