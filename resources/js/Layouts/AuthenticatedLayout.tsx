import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import { PageProps } from '@/types';

type User = {
    name: string;
    email: string;
    role: 'admin' | 'general';
};

type Can = {
    admin_users?: boolean;
    admin_csv?: boolean;
    admin_credentials?: boolean;
    admin_discord_notifications?: boolean;
    admin_audit_logs?: boolean;
};

const navItems: {
    label: string;
    route: string;
    icon: string;
    canKey?: keyof Can;
    alsoMatch?: string[];
}[] = [
    { label: 'ホーム', route: 'home', icon: 'home' },
    { label: '案件・KPI', route: 'sales.summary', icon: 'chart', alsoMatch: ['sales.records'] },
    { label: 'タスク管理', route: 'task-requests.index', icon: 'task' },
    { label: '社内情報', route: 'notices.index', icon: 'notice' },
    { label: '各商材について', route: 'products.index', icon: 'product', alsoMatch: ['products.show'] },
    { label: '昼休憩', route: 'lunch-breaks.index', icon: 'lunch' },
    { label: 'マイページ', route: 'mypage.index', icon: 'user' },
    { label: 'CSV取込', route: 'admin.csv.upload', icon: 'csv', canKey: 'admin_csv' },
    { label: 'IDパス管理', route: 'admin.credentials.index', icon: 'key', canKey: 'admin_credentials' },
    { label: 'ユーザー管理', route: 'admin.users.index', icon: 'users', canKey: 'admin_users' },
    { label: 'Discordログ', route: 'admin.discord-notifications.index', icon: 'discord', canKey: 'admin_discord_notifications' },
    { label: '監査ログ', route: 'admin.audit-logs.index', icon: 'audit', canKey: 'admin_audit_logs' },
];

function NavIcon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
    switch (name) {
        case 'home':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            );
        case 'chart':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            );
        case 'task':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'notice':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                </svg>
            );
        case 'product':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
            );
        case 'lunch':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'user':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            );
        case 'csv':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            );
        case 'key':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
            );
        case 'users':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            );
        case 'discord':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
            );
        case 'audit':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
            );
        case 'logout':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
            );
        default:
            return <div className="h-4 w-4" />;
    }
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { props } = usePage<PageProps>();

    const { auth } = props;
    const user = auth?.user ?? null;
    const can: Can = (auth as any)?.can ?? {};
    const safeUser: User = {
        name: user?.name ?? 'ゲストユーザー',
        email: user?.email ?? '',
        role: user?.role === 'admin' ? 'admin' : 'general',
    };

    const safeHref = (name: string): string | null => {
        try {
            return route(name);
        } catch {
            return null;
        }
    };

    const currentSafe = (name: string): boolean => {
        try {
            return route().current(name);
        } catch {
            return false;
        }
    };

    const isNavActive = (item: (typeof navItems)[number]): boolean => {
        if (currentSafe(item.route)) return true;
        return item.alsoMatch?.some((r) => currentSafe(r)) ?? false;
    };

    return (
        <div className="min-h-screen bg-wa-ink text-wa-body wa-body-track">
            <div className="flex min-h-screen gap-6 p-4 md:gap-8 md:p-6">
                <aside className="flex w-64 shrink-0 flex-col">
                    <div className="flex h-full flex-col rounded-sm border border-wa-accent/20 bg-wa-card">
                        {/* Brand block */}
                        <div className="border-b border-wa-accent/15 px-5 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-wa-accent/30 bg-wa-ink">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-wa-accent" fill="currentColor">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-base font-black tracking-tight text-wa-body">
                                        LOM.Hub<span className="text-wa-accent">.</span>
                                    </div>
                                    <div className="text-[10px] font-medium text-wa-muted">
                                        Sales Operating System
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User block */}
                        <div className="border-b border-wa-accent/15 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wa-accent/20 bg-wa-ink">
                                    <svg className="h-4 w-4 text-wa-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-wa-body">{safeUser.name}</div>
                                    <div className="truncate text-[11px] text-wa-muted">{safeUser.email || '—'}</div>
                                </div>
                                <span
                                    className={
                                        'shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-bold ' +
                                        (safeUser.role === 'admin'
                                            ? 'border border-amber-500/35 bg-wa-ink text-amber-300'
                                            : 'border border-teal-500/30 bg-wa-ink text-teal-300')
                                    }
                                >
                                    {safeUser.role === 'admin' ? 'ADMIN' : 'STAFF'}
                                </span>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                            {navItems
                                .filter((item) => {
                                    if (!item.canKey) return true;
                                    return !!can[item.canKey];
                                })
                                .map((item) => ({
                                    ...item,
                                    href: safeHref(item.route),
                                }))
                                .map((item) => {
                                    const active = isNavActive(item);
                                    return item.href ? (
                                        <Link
                                            key={item.route}
                                            href={item.href as string}
                                            className={
                                                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors ' +
                                                (active
                                                    ? 'border-l-2 border-l-wa-accent bg-wa-ink text-wa-accent'
                                                    : 'border-l-2 border-l-transparent text-wa-muted hover:bg-wa-ink/60 hover:text-wa-body')
                                            }
                                        >
                                            <NavIcon name={item.icon} />
                                            <span>{item.label}</span>
                                        </Link>
                                    ) : (
                                        <div
                                            key={item.route}
                                            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-wa-muted/40 border-l-2 border-l-transparent"
                                            title={`Route not found: ${item.route}`}
                                        >
                                            <NavIcon name={item.icon} />
                                            <span>{item.label}</span>
                                        </div>
                                    );
                                })}
                        </nav>

                        {/* Logout */}
                        <div className="border-t border-wa-accent/15 px-3 py-3">
                            {auth?.user ? (
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-wa-muted transition hover:text-wa-body"
                                >
                                    <NavIcon name="logout" />
                                    <span>ログアウト</span>
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-wa-muted transition hover:text-wa-body"
                                >
                                    <NavIcon name="logout" />
                                    <span>ログイン</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    {/* Header strip */}
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-wa-muted">
                                現在の画面
                            </div>
                            <div className="mt-1 truncate text-lg font-black tracking-tight text-wa-body">
                                {header ?? '—'}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <div className="text-xs font-medium text-emerald-400">接続中</div>
                        </div>
                    </div>

                    {/* Page content */}
                    <div>{children}</div>
                </main>
            </div>
        </div>
    );
}
