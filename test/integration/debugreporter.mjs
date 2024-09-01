// npx tsimp --test --test-reporter=./test/integration/debugreporter.mjs ./test/integration/test.mts
import { inspect } from 'node:util';

/**
 * @param {AsyncGenerator<import('node:test/reporters').TestEvent, void>} source
 * @returns {AsyncGenerator<string, void>}
 */
export default async function* debugReporter(source) {
    const result = [];
    for await (const data of source) {
        if (data.type === 'test:start' || data.type === 'test:pass' || data.type === 'test:fail') {
            result.push(data);
        }
    }

    yield inspect(result, false, Infinity, false);
    yield '\n';
}
