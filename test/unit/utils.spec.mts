import { afterEach, before, describe, test } from 'node:test';
import { equal } from 'node:assert/strict';
import { escapeXmlAttribute, getFilename, tag } from '../../lib/utils.mjs';

await describe('utils', async () => {
    await describe('escapeXmlAttribute', async () => {
        await test('should properly escape the string', () => {
            const input = `This is a "test" & it's <unsafe>`;
            const expected = 'This is a &quot;test&quot; &amp; it&apos;s &lt;unsafe&gt;';
            const actual = escapeXmlAttribute(input);
            equal(actual, expected);
        });
    });

    await describe('tag', async () => {
        await test('should generate a self-closing tag without attributes', () => {
            const result = tag('br', {}, true);
            equal(result, '<br/>');
        });

        await test('should generate a self-closing tag with attributes', () => {
            const result = tag('img', { src: 'image.png', alt: 'An image' }, true);
            equal(result, '<img src="image.png" alt="An image"/>');
        });

        await test('should generate a non-self-closing tag without content', () => {
            const result = tag('div', { class: 'container' }, false);
            equal(result, '<div class="container">');
        });

        await test('should generate a non-self-closing tag with content', () => {
            const result = tag('p', { class: 'text' }, false, 'Hello, world!');
            equal(result, '<p class="text">Hello, world!</p>');
        });

        await test('should escape special characters in attributes', () => {
            const result = tag(
                'a',
                { href: 'https://example.com?param=1&other=<value>', title: 'A "link"' },
                false,
                'Click here',
            );
            equal(
                result,
                '<a href="https://example.com?param=1&amp;other=&lt;value&gt;" title="A &quot;link&quot;">Click here</a>',
            );
        });
    });

    await describe('getFilename', async () => {
        let originalEnv: typeof process.env;

        before(() => {
            originalEnv = { ...process.env };
            process.env = {};
        });

        afterEach(() => {
            process.env = { ...originalEnv };
        });

        await test('returns "-" when file is undefined', () => equal(getFilename(undefined), '-'));

        await test('returns the file name when it does not start with the prefix', () => {
            const file = '/some/other/path/file.txt';
            const result = getFilename(file);
            equal(result, file);
        });

        await test('returns the relative path when file starts with the prefix', () => {
            const prefix = process.cwd();
            const file = `${prefix}/file.txt`;
            const result = getFilename(file);
            equal(result, 'file.txt');
        });

        await test('GITHUB_WORKSPACE has precedence over npm_config_local_prefix', () => {
            process.env['GITHUB_WORKSPACE'] = '/github/workspace';
            process.env['npm_config_local_prefix'] = '/github/workspace/test';
            const file = '/github/workspace/test/file.txt';
            const result = getFilename(file);
            equal(result, 'test/file.txt');
        });

        await test('npm_config_local_prefix is used when GITHUB_WORKSPACE is not set', () => {
            delete process.env['GITHUB_WORKSPACE'];
            process.env['npm_config_local_prefix'] = '/npm/prefix';
            const file = '/npm/prefix/file.txt';
            const result = getFilename(file);
            equal(result, 'file.txt');
        });

        await test('should convert file URL to path', () => {
            const file = 'file:///path/to/file.txt';
            const result = getFilename(file);
            equal(result, '/path/to/file.txt');
        });
    });
});
