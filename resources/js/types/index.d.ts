export interface User {
    id: number;
    name: string;
    email?: string | null;
    email_verified_at?: string;
    role?: 'admin' | 'general';
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth?: {
        user?: User | null;
    };
};
