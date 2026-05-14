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
        can?: {
            admin_users?: boolean;
            admin_csv?: boolean;
            admin_credentials?: boolean;
            admin_discord_notifications?: boolean;
            admin_audit_logs?: boolean;
        };
    };
    portalAlerts?: {
        lunch_not_started_count?: number;
        unread_notices_count?: number;
        server_time?: string;
    };
};
