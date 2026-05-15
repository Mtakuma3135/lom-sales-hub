import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { PageProps } from '@/types';
import LomHubMark from '@/Components/LomHubMark';

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

type PortalAlerts = {
    lunch_not_started_count?: number;
    unread_notices_count?: number;
    server_time?: string;
};

type NavIcon = 'dashboard' | 'chart' | 'table' | 'megaphone' | 'clipboard' | 'coffee' | 'box' | 'user' | 'users' | 'upload' | 'key' | 'discord' | 'audit';

function NavIconSvg({ name, className }: { name: NavIcon; className?: string }) {
    const c = 'h-5 w-5 shrink-0 transition-transform duration-200 ' + (className ?? 'text-wa-muted');
    switch (name) {
        case 'dashboard':
            return (
                <svg className={c + ' group-hover:-translate-y-0.5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <rect x="3" y="3" width="7" height="7" rx="1.2" />
                    <rect x="14" y="3" width="7" height="7" rx="1.2" />
                    <rect x="3" y="14" width="7" height="7" rx="1.2" />
                    <rect x="14" y="14" width="7" height="7" rx="1.2" />
                </svg>
            );
        case 'chart':
            return (
                <svg className={c + ' group-hover:scale-y-110 origin-bottom'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M4 19V5M4 19h16" />
                    <path d="M8 16v-5M12 16V8M16 16v-3" />
                </svg>
            );
        case 'table':
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                    <path d="M5 9h14M9 3v18" />
                </svg>
            );
        case 'megaphone':
            return (
                <svg className={c + ' group-hover:[animation:lom-wiggle_0.45s_ease-in-out]'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M4 11v4l3 2v-8L4 11zM7 9h6l4-2v10l-4-2H7" />
                    <path d="M17 8v8" />
                </svg>
            );
        case 'clipboard':
            return (
                <svg className={c + ' group-hover:-translate-y-0.5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M9 4h6l1 2h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3l1-2z" />
                    <path d="M9 12h6M9 16h4" />
                </svg>
            );
        case 'coffee':
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z" />
                    <path d="M16 10h2a2 2 0 0 1 0 4h-2M7 21h8" />
                    <path className="opacity-0 group-hover:[animation:lom-steam_1.4s_ease-out_0s_infinite]" d="M9 8.5C9 7 10 7 10 5.5" strokeLinecap="round" strokeWidth="1.4" />
                    <path className="opacity-0 group-hover:[animation:lom-steam_1.4s_ease-out_0.55s_infinite]" d="M12 8.5C12 7 13 7 13 5.5" strokeLinecap="round" strokeWidth="1.4" />
                </svg>
            );
        case 'box':
            return (
                <svg className={c + ' group-hover:-translate-y-0.5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7l8-4z" />
                    <path d="M12 12l8-4M12 12v9M12 12L4 8" />
                </svg>
            );
        case 'user':
            return (
                <svg className={c + ' group-hover:scale-110'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
                </svg>
            );
        case 'users':
            return (
                <svg className={c + ' group-hover:[animation:lom-float_0.5s_ease-in-out]'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <circle cx="8" cy="8" r="2.8" />
                    <path d="M3 19v-1a4 4 0 0 1 4-4h2" />
                    <circle cx="16" cy="7" r="2.5" />
                    <path d="M14 19v-1a4 4 0 0 1 3.8-4H21" />
                </svg>
            );
        case 'upload':
            return (
                <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M12 4v10M8 8l4-4 4 4M5 20h14" />
                </svg>
            );
        case 'key':
            return (
                <svg className={c + ' group-hover:[animation:lom-key-spin_0.45s_ease-in-out]'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <circle cx="8" cy="14" r="3" />
                    <path d="M11 11l7-7 2 2-7 7M15 7l2 2" />
                </svg>
            );
        case 'discord':
            return (
                <svg className={c + ' group-hover:scale-110'} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M19.27 5.33A17.2 17.2 0 0 0 14.86 4c-.19.35-.41.82-.56 1.19a16.3 16.3 0 0 0-4.6 0c-.15-.37-.37-.84-.56-1.2a17.1 17.1 0 0 0-4.43 1.34 17.5 17.5 0 0 0-2.75 11.1 17.3 17.3 0 0 0 5.27 2.65c.4-.54.75-1.12 1.05-1.73a11.1 11.1 0 0 1-1.67-.8c.14-.1.28-.21.41-.32 3.23 1.5 6.73 1.5 9.94 0 .14.11.27.22.41.32-.53.31-1.09.58-1.67.8.3.61.65 1.19 1.05 1.73a17.2 17.2 0 0 0 5.29-2.65c.45-3.6-.7-6.72-2.75-9.1zM9.5 13.38c-.97 0-1.78-.9-1.78-2s.78-2 1.78-2 1.8.9 1.78 2-.8 2-1.78 2zm5 0c-.97 0-1.78-.9-1.78-2s.78-2 1.78-2 1.78.9 1.78 2-.8 2-1.78 2z" />
                </svg>
            );
        case 'audit':
            return (
                <svg className={c + ' group-hover:[animation:lom-float_0.4s_ease-in-out]'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                    <path d="M9 14l2 2 4-4" />
                </svg>
            );
        default:
            return <span className={c} />;
    }
}

type NavItem = {
    label: string;
    route: string;
    icon: NavIcon;
    canKey?: keyof Can;
    alsoMatch?: string[];
    hrefSuffix?: string;
};

function buildNavItems(): NavItem[] {
    return [
        { label: 'ホーム', route: 'home', icon: 'dashboard' },
        { label: 'KPI・案件', route: 'sales.summary', icon: 'chart', alsoMatch: ['sales.ranking', 'sales.trend', 'sales.records'] },
        { label: '周知', route: 'notices.index', icon: 'megaphone', alsoMatch: ['notices.drafts'] },
        { label: '業務依頼', route: 'task-requests.index', icon: 'clipboard' },
        { label: '昼休憩', route: 'lunch-breaks.index', icon: 'coffee' },
        { label: '商材一覧', route: 'products.index', icon: 'box', alsoMatch: ['products.show'] },
        { label: 'マイページ', route: 'mypage.index', icon: 'user' },
        { label: 'ユーザー管理', route: 'admin.users.index', icon: 'users', canKey: 'admin_users' },
        { label: 'IDパス管理', route: 'admin.credentials.index', icon: 'key', canKey: 'admin_credentials' },
        { label: 'Discordログ', route: 'admin.discord-notifications.index', icon: 'discord', canKey: 'admin_discord_notifications' },
        { label: '監査ログ', route: 'admin.audit-logs.index', icon: 'audit', canKey: 'admin_audit_logs' },
    ];
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { props } = usePage<PageProps>();

    const { auth } = props;
    const user = auth?.user ?? null;
    const can: Can = (auth as { can?: Can })?.can ?? {};
    const portalAlerts: PortalAlerts = (props as { portalAlerts?: PortalAlerts }).portalAlerts ?? {};

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

    const isNavActive = (item: NavItem): boolean => {
        if (currentSafe(item.route)) return true;
        return item.alsoMatch?.some((r) => currentSafe(r)) ?? false;
    };

    const lunchN = portalAlerts.lunch_not_started_count ?? 0;
    const unreadN = portalAlerts.unread_notices_count ?? 0;

    const navItems = buildNavItems().filter((item) => {
        if (!item.canKey) return true;
        return !!can[item.canKey];
    });

    return (
        <div className="min-h-screen bg-wa-ink text-wa-body wa-body-track">
            <div className="flex min-h-screen gap-8 px-6 py-8 md:px-10 md:py-10">
                <aside className="flex w-72 shrink-0 flex-col">
                    <div className="flex h-full flex-col rounded-2xl border border-wa-accent/15 bg-wa-card p-5 shadow-nordic">
                        <div className="rounded-2xl border border-wa-accent/15 bg-wa-ink px-5 py-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xl font-semibold tracking-tight text-wa-body">
                                        LOM<span className="text-wa-accent">.</span>Hub
                                    </div>
                                    <div className="mt-1 text-xs font-medium text-wa-muted">Sales Operating System</div>
                                </div>
                                <div className="grid h-9 w-9 place-items-center rounded-xl border border-wa-accent/25 bg-wa-subtle text-wa-accent">
                                    <LomHubMark className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-wa-body">{safeUser.name}</div>
                                    <div className="truncate text-xs text-wa-muted">{safeUser.email || '—'}</div>
                                </div>
                                <span
                                    className={
                                        'shrink-0 rounded-xl border px-2.5 py-1 text-[11px] font-semibold ' +
                                        (safeUser.role === 'admin'
                                            ? 'border-amber-500/35 bg-wa-ink text-amber-300'
                                            : 'border-wa-accent/30 bg-wa-ink text-wa-accent')
                                    }
                                >
                                    {safeUser.role === 'admin' ? 'ADMIN' : 'STAFF'}
                                </span>
                            </div>
                        </div>

                        <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto py-2">
                            {navItems.map((item) => {
                                const base = safeHref(item.route);
                                const href = base ? `${base}${item.hrefSuffix ?? ''}` : null;
                                return href ? (
                                    <Link
                                        key={item.route + item.label + (item.hrefSuffix ?? '')}
                                        href={href}
                                        className={
                                            'group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ' +
                                            (isNavActive(item)
                                                ? 'border border-wa-accent/30 bg-wa-ink text-wa-body shadow-[inset_0_0_0_1px_rgba(192,132,87,0.12)]'
                                                : 'border border-transparent text-wa-muted hover:border-wa-accent/15 hover:bg-wa-ink hover:text-wa-body')
                                        }
                                    >
                                        <NavIconSvg
                                            name={item.icon}
                                            className={
                                                isNavActive(item) ? 'text-wa-accent' : 'text-wa-muted group-hover:text-wa-accent/80'
                                            }
                                        />
                                        {isNavActive(item) ? (
                                            <span className="absolute left-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-wa-accent" />
                                        ) : null}
                                        <span className="pl-1">{item.label}</span>
                                    </Link>
                                ) : (
                                    <div
                                        key={item.route + item.label + (item.hrefSuffix ?? '')}
                                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-wa-muted/50"
                                        title={`Route not found: ${item.route}`}
                                    >
                                        <NavIconSvg name={item.icon} />
                                        {item.label}
                                    </div>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-2">
                            {auth?.user ? (
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full rounded-xl border border-wa-accent/20 bg-wa-ink px-5 py-3.5 text-left text-sm font-semibold text-wa-body transition hover:border-wa-accent/35"
                                >
                                    ログアウト
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="block w-full rounded-xl border border-wa-accent/20 bg-wa-ink px-5 py-3.5 text-left text-sm font-semibold text-wa-body transition hover:border-wa-accent/35"
                                >
                                    ログイン
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    <div className="rounded-2xl border border-wa-accent/15 bg-wa-card shadow-nordic">
                        <div className="flex flex-col gap-4 border-b border-wa-accent/15 px-6 py-6 sm:px-8 sm:py-7">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">現在の画面</div>
                                    <div className="mt-2 truncate text-lg font-semibold tracking-tight text-wa-body">{header ?? '—'}</div>
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                                    {lunchN > 0 ? (
                                        <Link
                                            href={route('lunch-breaks.index')}
                                            className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-100 transition hover:border-amber-400/60"
                                        >
                                            昼休憩 未開始 {lunchN}名
                                        </Link>
                                    ) : null}
                                    {unreadN > 0 ? (
                                        <Link
                                            href={route('notices.index')}
                                            className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-[11px] font-bold text-red-100 transition hover:border-red-400/60"
                                        >
                                            未読周知 {unreadN}件
                                        </Link>
                                    ) : null}
                                    <HeaderClock serverTimeIso={portalAlerts.server_time} />
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-wa-accent/20 text-wa-muted" title="通知（バッジ参照）">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                                            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7M10 20h4" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-wa-ink px-6 py-10 sm:px-10 sm:py-14">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function HeaderClock({ serverTimeIso }: { serverTimeIso?: string }) {
    const initial = (() => {
        if (!serverTimeIso) return 0;
        const ms = new Date(serverTimeIso).getTime();
        return Number.isFinite(ms) ? ms - Date.now() : 0;
    })();
    const [offset, setOffset] = useState(initial);
    useEffect(() => {
        if (!serverTimeIso) return;
        const ms = new Date(serverTimeIso).getTime();
        if (Number.isFinite(ms)) setOffset(ms - Date.now());
    }, [serverTimeIso]);
    const [tick, setTick] = useState(() => Date.now() + offset);
    useEffect(() => {
        const id = window.setInterval(() => setTick(Date.now() + offset), 1000);
        return () => window.clearInterval(id);
    }, [offset]);
    const label = new Date(tick).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return (
        <div className="flex items-center gap-2 rounded-xl border border-wa-accent/25 bg-wa-ink px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-wa-muted">現在の時刻</span>
            <span className="wa-nums text-base font-black tabular-nums text-wa-body sm:text-lg">{label}</span>
        </div>
    );
}
