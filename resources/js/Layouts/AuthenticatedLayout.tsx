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
    { label: 'ホーム', route: 'home', icon: '⌂' },
    { label: '案件・KPI', route: 'sales.summary', icon: '◎', alsoMatch: ['sales.records'] },
    { label: 'タスク管理', route: 'task-requests.index', icon: '☑' },
    { label: '社内情報', route: 'notices.index', icon: '▤' },
    { label: '各商材について', route: 'products.index', icon: '◈', alsoMatch: ['products.show'] },
    { label: '昼休憩', route: 'lunch-breaks.index', icon: '◷' },
    { label: 'マイページ', route: 'mypage.index', icon: '◉' },
    { label: 'CSV取込', route: 'admin.csv.upload', icon: '⇪', canKey: 'admin_csv' },
    { label: 'IDパス管理', route: 'admin.credentials.index', icon: '⚿', canKey: 'admin_credentials' },
    { label: 'ユーザー管理', route: 'admin.users.index', icon: '⊕', canKey: 'admin_users' },
    { label: 'Discordログ', route: 'admin.discord-notifications.index', icon: '◬', canKey: 'admin_discord_notifications' },
    { label: '監査ログ', route: 'admin.audit-logs.index', icon: '⊞', canKey: 'admin_audit_logs' },
];

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
            <div className="flex min-h-screen gap-9 px-6 py-9 md:px-12 md:py-12">
                <aside className="hidden w-64 shrink-0 flex-col lg:flex">
                    <div className="flex h-full flex-col rounded-sm border border-wa-accent/25 bg-wa-card p-5">
                        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-5 py-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-lg font-semibold tracking-tight text-wa-body">
                                        LOM<span className="text-wa-accent">.</span>Hub
                                    </div>
                                    <div className="mt-1 text-xs font-medium text-wa-muted">Sales Operating System</div>
                                </div>
                                <div className="h-9 w-9 rounded-sm border border-wa-accent/30 bg-wa-subtle" />
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-wa-body">{safeUser.name}</div>
                                    <div className="truncate text-xs text-wa-muted">{safeUser.email || '—'}</div>
                                </div>
                                <span
                                    className={
                                        'shrink-0 rounded-sm border px-2.5 py-1 text-[11px] font-semibold ' +
                                        (safeUser.role === 'admin'
                                            ? 'border-amber-500/35 bg-wa-ink text-amber-300'
                                            : 'border-wa-accent/30 bg-wa-ink text-wa-accent')
                                    }
                                >
                                    {safeUser.role === 'admin' ? 'ADMIN' : 'STAFF'}
                                </span>
                            </div>
                        </div>

                        <nav className="mt-5 flex-1 space-y-1 py-2">
                            {navItems
                                .filter((item) => {
                                    if (!item.canKey) return true;
                                    return !!can[item.canKey];
                                })
                                .map((item) => ({
                                    ...item,
                                    href: safeHref(item.route),
                                }))
                                .map((item) =>
                                    item.href ? (
                                        <Link
                                            key={item.route}
                                            href={item.href as string}
                                            className={
                                                'flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors ' +
                                                (isNavActive(item)
                                                    ? 'border border-wa-accent/35 bg-wa-ink text-wa-accent'
                                                    : 'border border-transparent text-wa-muted hover:border-wa-accent/20 hover:bg-wa-ink hover:text-wa-body')
                                            }
                                        >
                                            <span className="w-4 text-center text-xs opacity-70">{item.icon}</span>
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <div
                                            key={item.route}
                                            className="flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm font-medium text-wa-muted/50"
                                            title={`Route not found: ${item.route}`}
                                        >
                                            <span className="w-4 text-center text-xs opacity-50">{item.icon}</span>
                                            {item.label}
                                        </div>
                                    ),
                                )}
                        </nav>

                        <div className="mt-auto pt-2">
                            {auth?.user ? (
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2.5 rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-3 text-left text-sm font-semibold text-wa-body transition hover:border-wa-accent/40"
                                >
                                    <span className="w-4 text-center text-xs opacity-70">⊳</span>
                                    ログアウト
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="flex w-full items-center gap-2.5 rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-3 text-left text-sm font-semibold text-wa-body transition hover:border-wa-accent/40"
                                >
                                    <span className="w-4 text-center text-xs opacity-70">⊲</span>
                                    ログイン
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    <div className="rounded-sm border border-wa-accent/25 bg-wa-card">
                        <div className="flex items-center justify-between gap-4 border-b border-wa-accent/15 px-8 py-6">
                            <div className="min-w-0">
                                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">現在の画面</div>
                                <div className="mt-2 truncate text-base font-semibold text-wa-body">{header ?? '—'}</div>
                            </div>
                            <div className="hidden items-center gap-3 sm:flex">
                                <div className="h-2 w-2 rounded-full bg-wa-accent/80" />
                                <div className="text-xs font-medium text-wa-muted">接続中</div>
                            </div>
                        </div>
                        <div className="bg-wa-ink px-6 py-8 sm:px-8 sm:py-10">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}
