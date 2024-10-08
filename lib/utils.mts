import { fileURLToPath } from 'node:url';

export function escapeXmlAttribute(value: string): string {
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
    } as const;

    type EscapeMapKey = keyof typeof escapeMap;

    return value.replace(/[&<>"']/gu, (char) => escapeMap[char as EscapeMapKey]);
}

export function tag(
    name: string,
    attrs: Record<string, string> = {},
    close = true,
    content: string | undefined = undefined,
): string {
    const end = close && !content ? '/>' : '>';
    const pairs: string[] = [];

    for (const key in attrs) {
        if (Object.hasOwn(attrs, key)) {
            const k = escapeXmlAttribute(key);
            const v = escapeXmlAttribute(attrs[key]!);
            pairs.push(`${k}="${v}"`);
        }
    }

    const attrsStr = pairs.length ? ` ${pairs.join(' ')}` : '';
    let tag = `<${name}${attrsStr}${end}`;
    if (content) {
        tag += `${content}</${name}${end}`;
    }

    return tag;
}

export function getFilename(file: string | undefined): string {
    if (!file) {
        return '-';
    }

    if (file.startsWith('file://')) {
        file = fileURLToPath(file);
    }

    const prefix = process.env['GITHUB_WORKSPACE'] ?? process.env['npm_config_local_prefix'] ?? process.cwd();
    return prefix && file.startsWith(prefix) ? file.slice(prefix.length + 1) : file;
}
