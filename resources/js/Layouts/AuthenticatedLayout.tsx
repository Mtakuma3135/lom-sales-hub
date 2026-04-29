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
    canKey?: keyof Can;
    /** 同一メニュー扱いにしたい追加ルート（ワイルドカードは使わない — admin.* は誤ハイライトの原因になる） */
    alsoMatch?: string[];
}[] = [
    { label: 'ホーム', route: 'home' },
    { label: '案件・KPI', route: 'sales.summary', alsoMatch: ['sales.records'] },
    { label: 'タスク管理', route: 'task-requests.index' },
    { label: '社内情報', route: 'notices.index' },
    { label: '各商材について', route: 'products.index', alsoMatch: ['products.show'] },
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

    const isNavActive = (item: (typeof navItems)[number]): boolean => {
        if (currentSafe(item.route)) return true;
        return item.alsoMatch?.some((r) => currentSafe(r)) ?? false;
    };

    return (
        <div className="min-h-screen bg-emerald-950 text-stone-700">
            <div className="flex min-h-screen gap-6 px-4 py-6 md:px-8 md:py-8">
                <aside className="flex w-72 shrink-0 flex-col">
                    <div className="flex h-full flex-col rounded-3xl border border-stone-100 bg-white p-4 shadow-nordic">
                        <div className="rounded-2xl border border-stone-100 bg-stone-50/60 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-lg font-semibold tracking-tight text-stone-800">
                                        LOM<span className="text-emerald-600">.</span>Hub
                                    </div>
                                    <div className="mt-0.5 text-xs font-medium text-stone-500">
                                        Sales Operating System
                                    </div>
                                </div>
                                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/20" />
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-stone-800">{safeUser.name}</div>
                                    <div className="truncate text-xs text-stone-500">{safeUser.email || '—'}</div>
                                </div>
                                <span
                                    className={
                                        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ' +
                                        (safeUser.role === 'admin'
                                            ? 'bg-amber-50 text-amber-800 ring-amber-200/80'
                                            : 'bg-emerald-50 text-emerald-800 ring-emerald-200/80')
                                    }
                                >
                                    {safeUser.role === 'admin' ? 'ADMIN' : 'STAFF'}
                                </span>
                            </div>
                        </div>

                        <nav className="mt-4 flex-1 space-y-1 px-0.5 py-2">
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
                                                'block rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight transition-all duration-200 ' +
                                                (isNavActive(item)
                                                    ? 'bg-emerald-50 text-emerald-900 shadow-sm shadow-stone-900/5 ring-1 ring-emerald-100'
                                                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900')
                                            }
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <div
                                            key={item.route}
                                            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-stone-300"
                                            title={`Route not found: ${item.route}`}
                                        >
                                            {item.label}
                                        </div>
                                    )
                                )}
                        </nav>

                        <div className="mt-auto p-1">
                            {auth?.user ? (
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-700 shadow-sm shadow-stone-900/5 transition hover:bg-stone-50"
                                >
                                    ログアウト
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
                                >
                                    ログイン
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    <div className="rounded-3xl border border-stone-100 bg-white shadow-nordic">
                        <div className="flex items-center justify-between gap-4 border-b border-stone-100 px-8 py-6">
                            <div className="min-w-0">
                                <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                                    現在の画面
                                </div>
                                <div className="mt-1 truncate text-base font-semibold tracking-tight text-stone-800">
                                    {header ?? '—'}
                                </div>
                            </div>
                            <div className="hidden items-center gap-2 sm:flex">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                                <div className="text-xs font-medium text-stone-500">接続中</div>
                            </div>
                        </div>
                        <div className="bg-emerald-950/5 px-4 py-8 sm:px-8 sm:py-10">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}
