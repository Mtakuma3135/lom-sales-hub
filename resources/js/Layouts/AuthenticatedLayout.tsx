import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import { PageProps } from '@/types';

// 型定義
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

// サイドバーメニュー定義（指示書：機能ごと・管理者区分を分離）
const navItems: {
    label: string;
    route: string;
    canKey?: keyof Can;
}[] = [
    { label: 'ホーム', route: 'home' },
    { label: '案件・KPI', route: 'sales.summary' },
    { label: 'タスク管理', route: 'task-requests.index' },
    { label: '社内情報', route: 'notices.index' },
    { label: '各商材について', route: 'products.index' },
    { label: '昼休憩', route: 'lunch-breaks.index' },
    { label: 'マイページ', route: 'mypage.index' },
    { label: 'CSV取込', route: 'admin.csv.upload', canKey: 'admin_csv' },
    { label: 'IDパス管理', route: 'admin.credentials.index', canKey: 'admin_credentials' },
    { label: 'ユーザー管理', route: 'admin.users.index', canKey: 'admin_users' },
    { label: 'Discordログ', route: 'admin.discord-notifications.index', canKey: 'admin_discord_notifications' },
    { label: '監査ログ', route: 'admin.audit-logs.index', canKey: 'admin_audit_logs' },
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

    return (
        <div className="min-h-screen bg-[#0b1020] text-slate-100">
            {/* 背景のネオンぼかし */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-purple-500/35 to-cyan-400/20 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-cyan-400/25 to-fuchsia-500/20 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            <div className="flex min-h-screen px-4 py-5 md:px-6">
                {/* サイドバー */}
                <aside className="flex w-72 flex-col">
                    <div className="relative flex h-full flex-col rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-br from-purple-500/25 to-cyan-400/15 opacity-70 blur-[18px]" />

                        {/* ロゴ&ユーザー情報 */}
                        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 px-4 py-4 backdrop-blur-md">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-lg font-black tracking-tighter text-white">
                                        LOM<span className="text-cyan-300">.</span>Hub
                                    </div>
                                    <div className="mt-0.5 text-xs text-white/60">
                                        Sales Operating System
                                    </div>
                                </div>
                                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.35)]" />
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-white/90">
                                        {safeUser.name}
                                    </div>
                                    <div className="truncate text-xs text-white/55">
                                        {safeUser.email || '—'}
                                    </div>
                                </div>
                                <span
                                    className={
                                        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ' +
                                        (safeUser.role === 'admin'
                                            ? 'bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-400/25'
                                            : 'bg-cyan-500/15 text-cyan-200 ring-1 ring-inset ring-cyan-400/25')
                                    }
                                >
                                    {safeUser.role === 'admin' ? 'ADMIN' : 'GENERAL'}
                                </span>
                            </div>
                        </div>

                        {/* ナビゲーション */}
                        <nav className="relative mt-3 flex-1 space-y-1 px-1 py-2">
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
                                                'group relative block rounded-2xl px-4 py-3 text-sm font-black tracking-tight transition-all duration-200 ' +
                                                (currentSafe(item.route) ||
                                                currentSafe(item.route.split('.')[0] + '.*')
                                                    ? 'bg-gradient-to-r from-purple-500/30 to-cyan-400/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_0_24px_rgba(168,85,247,0.22)] ring-1 ring-inset ring-white/10'
                                                    : 'text-white/75 hover:bg-white/7 hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]')
                                            }
                                        >
                                            <span className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-purple-500/10 to-cyan-400/10" />
                                            <span className="relative">{item.label}</span>
                                        </Link>
                                    ) : (
                                        <div
                                            key={item.route}
                                            className="block rounded-2xl px-4 py-3 text-sm font-black tracking-tight text-white/30"
                                            title={`Route not found: ${item.route}`}
                                        >
                                            {item.label}
                                        </div>
                                    )
                                )}
                        </nav>

                        {/* ログアウト */}
                        <div className="relative mt-auto p-2">
                            {auth?.user ? (
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full rounded-2xl bg-white/5 px-4 py-3 text-left text-sm font-black tracking-tight text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                >
                                    LOGOUT
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="block w-full rounded-2xl bg-white/5 px-4 py-3 text-left text-sm font-black tracking-tight text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                >
                                    LOGIN
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>
                {/* メインコンテンツ */}
                <main className="ml-4 flex-1">
                    <div className="rounded-[28px] border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_50px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
                            <div className="min-w-0">
                                <div className="text-xs font-bold tracking-widest text-white/50">
                                    SYSTEM
                                </div>
                                <div className="mt-1 truncate text-sm font-black tracking-tight text-white/85">
                                    {header ?? '—'}
                                </div>
                            </div>
                            <div className="hidden items-center gap-2 sm:flex">
                                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                                <div className="text-xs font-semibold text-white/60">
                                    ONLINE
                                </div>
                            </div>
                        </div>
                        <div className="p-1">
                            <div className="rounded-[24px] bg-[#0b1020]/70">
                                {children}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
