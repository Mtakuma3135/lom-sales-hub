function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJson(json: string, theme: 'light' | 'dark'): string {
    const escaped = escapeHtml(json);
    const suffix = theme === 'light' ? '-light' : '';
    return escaped.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
            let cls = 'json-number' + suffix;
            if (match.startsWith('"')) {
                cls = (match.endsWith(':') ? 'json-key' : 'json-string') + suffix;
            } else if (match === 'true' || match === 'false') {
                cls = 'json-boolean' + suffix;
            } else if (match === 'null') {
                cls = 'json-null' + suffix;
            }
            return `<span class="${cls}">${match}</span>`;
        }
    );
}

export default function JsonCodeBlock({
    value,
    className = '',
    theme = 'light',
}: {
    value: unknown;
    className?: string;
    /** Nordic 監査ログは light */
    theme?: 'light' | 'dark';
}) {
    const text =
        typeof value === 'string'
            ? value
            : JSON.stringify(value ?? null, null, 2);

    const pretty = (() => {
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return JSON.stringify(parsed, null, 2);
            } catch {
                return value;
            }
        }
        return text;
    })();

    const preClass = theme === 'light' ? 'json-pre-light' : 'json-pre';

    return (
        <pre
            className={`${preClass} ${className}`}
            dangerouslySetInnerHTML={{ __html: highlightJson(pretty, theme) }}
        />
    );
}
