function getCsrfToken(): string {
    return (
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ??
        document.cookie
            .split('; ')
            .find((c) => c.startsWith('XSRF-TOKEN='))
            ?.split('=')[1]
            ?.replace(/%3D/g, '=') ??
        ''
    );
}

/**
 * Thin wrapper around `fetch` that injects the CSRF token and
 * default headers required by Laravel session-guarded routes.
 */
export async function apiFetch(
    url: string,
    options: RequestInit = {},
): Promise<Response> {
    const method = (options.method ?? 'GET').toUpperCase();
    const headers = new Headers(options.headers ?? {});

    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (!headers.has('X-Requested-With')) headers.set('X-Requested-With', 'XMLHttpRequest');

    if (method !== 'GET' && method !== 'HEAD') {
        if (!headers.has('Content-Type') && options.body) {
            headers.set('Content-Type', 'application/json');
        }
        const token = getCsrfToken();
        if (token) headers.set('X-CSRF-TOKEN', token);
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: options.credentials ?? 'same-origin',
    });
}
