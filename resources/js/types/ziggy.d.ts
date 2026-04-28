export {};

declare global {
    function route(
        name?: string,
        params?: Record<string, unknown> | unknown[] | string | number | null,
        absolute?: boolean,
        config?: unknown,
    ): string & {
        current: (name?: string) => boolean;
    };
}

