import { describe, test } from 'node:test';
import { equal } from 'node:assert/strict';
import { escapeXmlAttribute, tag } from '../../lib/utils.mjs';

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
});
