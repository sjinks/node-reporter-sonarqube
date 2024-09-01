import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('ts-node/esm/transpile-only', pathToFileURL('./'));

const reporter = await import('./index.mjs');
export default reporter.default;
