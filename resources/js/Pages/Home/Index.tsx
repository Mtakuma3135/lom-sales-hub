import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardTileLink from '@/Components/DashboardTileLink';
import NeonCard from '@/Components/NeonCard';
import SlotNumber from '@/Components/UI/SlotNumber';
import NoticeFeedItem from '@/Components/NoticeFeedItem';
import BreakRunner from '@/Components/BreakRunner';
import { PageProps } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

type NoticeRow = {
    id: number;
    title: string;
    body?: string | null;
    is_pinned: boolean;
    published_at?: string | null;
};

type LunchReservation = {
    user?: { id: number | null; name: string | null; role?: string | null };
};

type LunchSlot = {
    start_time: string;
    end_time: string;
    capacity: number;
    reservations: LunchReservation[];
};

type LunchLaneStatus = {
    lane: number;
    current: {
        user: { id: number; name: string } | null;
        started_at?: string | null;
        duration_minutes?: number;
    };
    next?: { user: { id: number; name: string } | null };
};

function laneRemainingMs(row: LunchLaneStatus, nowMs: number, totalMs: number): number | null {
    const started = row.current?.started_at;
    if (!started) return null;
    const t0 = new Date(started).getTime();
    if (!Number.isFinite(t0)) return null;
    return Math.max(0, totalMs - (nowMs - t0));
}

type KpiPayload = {
    summary: { ok: number; ng: number; contract_rate: number };
};

function formatTime(t: string | undefined): string {
    if (!t) return '';
    return t.length >= 8 ? t.slice(0, 5) : t.length >= 5 ? t.slice(0, 5) : t;
}

export default function Index({
    title,
    notices,
    lunchBreaks,
    kpi,
}: {
    title?: string;
    notices: { data: NoticeRow[]; meta?: Record<string, unknown> };
    lunchBreaks: { data: LunchSlot[]; meta?: { date?: string } };
    kpi: { data: KpiPayload; meta?: Record<string, unknown> };
}) {
    const pageTitle = title ?? 'ホーム';
    const { props } = usePage<PageProps>();
    const userId = props.auth?.user?.id ?? null;
    const userName = props.auth?.user?.name ?? 'ゲスト';

    const go = (href: string) => router.visit(href, { preserveScroll: true });
    const onCardKeyDown =
        (href: string) => (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            go(href);
        };

    const noticeRows = notices?.data ?? [];
    const lunchSlots = lunchBreaks?.data ?? [];
    const summary = kpi?.data?.summary ?? { ok: 0, ng: 0, contract_rate: 0 };

    const lunchTableRows = useMemo(() => {
        return lunchSlots.map((slot) => {
            const names = slot.reservations
                .map((r) => r.user?.name)
                .filter((n): n is string => !!n && n !== '—');
            const label = names.length > 0 ? names.join('、') : '—';
            return {
                time: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
                name: label,
            };
        });
    }, [lunchSlots]);

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const totalMs = 60 * 60 * 1000;
    const [timerState, setTimerState] = useState<{ startedAt: number; startTime: string } | null>(null);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [lanesFromApi, setLanesFromApi] = useState<LunchLaneStatus[]>([]);

    const fetchLunchStatus = useCallback(async () => {
        try {
            const url = `${route('portal.api.lunch-breaks.status')}?date=${encodeURIComponent(today)}`;
            const res = await fetch(url, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const json = (await res.json()) as { data?: { active?: LunchLaneStatus[] } };
            const rows = (json as any)?.data?.active;
            setLanesFromApi(Array.isArray(rows) ? (rows as LunchLaneStatus[]) : []);
        } catch {
            /* ignore */
        }
    }, [today]);

    useEffect(() => {
        void fetchLunchStatus();
        const id = window.setInterval(() => void fetchLunchStatus(), 15000);
        return () => window.clearInterval(id);
    }, [fetchLunchStatus]);

    useEffect(() => {
        if (!userId) return;
        const read = () => {
            const prefix = `lunchBreakTimer:${today}:`;
            const suffix = `:${userId}`;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k) continue;
                if (!k.startsWith(prefix) || !k.endsWith(suffix)) continue;
                const startedAt = Number(localStorage.getItem(k) ?? '');
                const startTime = k.slice(prefix.length, k.length - suffix.length);
                if (!Number.isFinite(startedAt)) continue;
                return { startedAt, startTime };
            }
            return null;
        };

        setTimerState(read());
        setNowMs(Date.now());

        const tick = window.setInterval(() => {
            setNowMs(Date.now());
            setTimerState(read());
        }, 500);

        const onStorage = (e: StorageEvent) => {
            if (!e.key) return;
            if (!e.key.startsWith(`lunchBreakTimer:${today}:`)) return;
            setTimerState(read());
        };
        window.addEventListener('storage', onStorage);

        return () => {
            window.clearInterval(tick);
            window.removeEventListener('storage', onStorage);
        };
    }, [today, userId]);

    const elapsedMs = timerState ? Math.max(0, nowMs - timerState.startedAt) : 0;
    const remainingLocal = timerState ? Math.max(0, totalMs - elapsedMs) : totalMs;

    const minApiRemaining = useMemo(() => {
        const vals = lanesFromApi
            .map((r) => laneRemainingMs(r, nowMs, totalMs))
            .filter((n): n is number => n !== null && n > 0 && n < totalMs);
        return vals.length ? Math.min(...vals) : null;
    }, [lanesFromApi, nowMs, totalMs]);

    const remainingMs = minApiRemaining !== null ? minApiRemaining : remainingLocal;

    const hasApiActive = minApiRemaining !== null;
    const hasLocalActive = timerState !== null && remainingLocal > 0 && remainingLocal < totalMs;
    const runnerActive = hasApiActive || hasLocalActive;

    const isWarning = runnerActive ? remainingMs <= 5 * 60 * 1000 && remainingMs > 0 : false;

    const activeNamesLabel = useMemo(() => {
        const names = lanesFromApi
            .map((r) => r.current?.user?.name)
            .filter((n): n is string => !!n && n.length > 0);
        if (names.length === 0) return null;
        return `休憩中: ${names.join('、')}`;
    }, [lanesFromApi]);

    const fmt = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    const publishedLabel = (raw: string | null | undefined) => {
        if (!raw) return undefined;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return String(raw);
        return d.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <span className="wa-body-track text-sm font-semibold text-wa-body">ホーム</span>
                </div>
            }
        >
            <Head title={pageTitle} />

            <div className="mx-auto max-w-6xl space-y-14 text-wa-body sm:space-y-16">
                <NeonCard
                    elevate
                    role="button"
                    tabIndex={0}
                    onClick={() => go(route('mypage.index'))}
                    onKeyDown={onCardKeyDown(route('mypage.index'))}
                    className="cursor-pointer p-10 sm:p-12"
                >
                    <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">ようこそ</div>
                    <div className="mt-4 text-2xl font-semibold tracking-tight text-wa-body">{userName}さん</div>
                    <p className="mt-3 text-sm leading-relaxed text-wa-muted">本日も無理のないペースで進めましょう。</p>
                </NeonCard>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-14">
                    <NeonCard
                        elevate
                        role="button"
                        tabIndex={0}
                        onClick={() => go(route('notices.index'))}
                        onKeyDown={onCardKeyDown(route('notices.index'))}
                        className="cursor-pointer p-10 sm:p-12 lg:col-span-2"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">周知</div>
                                <div className="mt-3 text-lg font-semibold tracking-tight text-wa-body">
                                    新着のお知らせ
                                </div>
                            </div>
                            <span className="rounded-sm border border-wa-accent/35 bg-wa-ink px-3 py-1 text-xs font-medium text-wa-accent">
                                最新 {noticeRows.length} 件
                            </span>
                        </div>

                        <div className="mt-10 space-y-5">
                            {noticeRows.length === 0 ? (
                                <div className="text-sm text-wa-muted">表示できるお知らせはありません。</div>
                            ) : (
                                noticeRows.map((n) => (
                                    <div key={n.id} onClick={(e) => e.stopPropagation()}>
                                        <NoticeFeedItem
                                            title={n.title}
                                            body={n.body ?? undefined}
                                            publishedAt={publishedLabel(n.published_at)}
                                            isPinned={n.is_pinned}
                                            onOpen={() => go(`${route('notices.index')}?open=${n.id}`)}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </NeonCard>

                    <NeonCard
                        elevate
                        role="button"
                        tabIndex={0}
                        onClick={() => go(route('sales.summary'))}
                        onKeyDown={onCardKeyDown(route('sales.summary'))}
                        className="cursor-pointer p-10 sm:p-12"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">KPI</div>
                                <div className="mt-3 text-lg font-semibold tracking-tight text-wa-body">今月</div>
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-1 gap-6">
                            {[
                                {
                                    label: '契約率',
                                    value: String(summary.contract_rate),
                                    suffix: '%',
                                    sub: 'OK / (OK + NG)',
                                    valClass: 'text-wa-body',
                                    href: `${route('sales.summary')}?tab=summary`,
                                },
                                {
                                    label: 'OK',
                                    value: String(summary.ok),
                                    suffix: '',
                                    sub: '今月合計',
                                    valClass: 'text-teal-300',
                                    href: `${route('sales.records')}?status=ok`,
                                },
                                {
                                    label: 'NG',
                                    value: String(summary.ng),
                                    suffix: '',
                                    sub: '今月合計',
                                    valClass: 'text-red-400',
                                    href: `${route('sales.records')}?status=ng`,
                                },
                            ].map((k) => (
                                <div
                                    key={k.label}
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        go(k.href);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key !== 'Enter' && e.key !== ' ') return;
                                        e.preventDefault();
                                        e.stopPropagation();
                                        go(k.href);
                                    }}
                                    className="border border-wa-accent/20 bg-wa-ink px-5 py-5 transition hover:border-wa-accent/35"
                                >
                                    <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">
                                        {k.label}
                                    </div>
                                    <div className={`wa-nums mt-2 text-2xl font-semibold tabular-nums ${k.valClass}`}>
                                        <SlotNumber value={k.value} />
                                        {k.suffix}
                                    </div>
                                    <div className="mt-2 text-xs text-wa-muted">{k.sub}</div>
                                </div>
                            ))}
                        </div>
                    </NeonCard>
                </div>

                <NeonCard
                    elevate
                    role="button"
                    tabIndex={0}
                    onClick={() => go(route('lunch-breaks.index'))}
                    onKeyDown={onCardKeyDown(route('lunch-breaks.index'))}
                    className="cursor-pointer p-10 sm:p-12"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">昼休憩</div>
                            <div className="mt-3 text-lg font-semibold tracking-tight text-wa-body">本日の予定</div>
                        </div>
                        {lunchBreaks?.meta?.date ? (
                            <span className="text-xs font-medium text-wa-muted">{lunchBreaks.meta.date}</span>
                        ) : null}
                    </div>

                    <div className="mt-8 space-y-5">
                        <BreakRunner
                            active={runnerActive}
                            remainingMs={remainingMs}
                            totalMs={totalMs}
                            label={
                                activeNamesLabel ??
                                (timerState
                                    ? `ローカルタイマー（開始 ${timerState.startTime}）`
                                    : '休憩が始まるとランナーが走ります')
                            }
                        />
                        <div className="border border-wa-accent/20 bg-wa-ink p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">
                                    60分プログレス
                                </div>
                                <div
                                    className={
                                        'text-xs font-semibold ' +
                                        (isWarning ? 'timer-breath text-red-400' : 'text-wa-muted')
                                    }
                                >
                                    {runnerActive ? `残り ${fmt(remainingMs)}` : '未開始'}
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full bg-wa-subtle">
                                <div
                                    className={
                                        'h-full transition-[width] duration-500 ease-out ' +
                                        (isWarning ? 'bg-red-500' : 'bg-wa-accent')
                                    }
                                    style={{
                                        width: `${
                                            runnerActive
                                                ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100))
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0 text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-wa-muted">
                                    <th className="border-b border-wa-accent/20 px-4 py-3">時間</th>
                                    <th className="border-b border-wa-accent/20 px-4 py-3">休憩者</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lunchTableRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="border-b border-wa-accent/15 px-4 py-4 text-wa-muted">
                                            本日の枠はありません。
                                        </td>
                                    </tr>
                                ) : (
                                    lunchTableRows.map((r) => (
                                        <tr key={r.time} className="transition-colors hover:bg-wa-ink/80">
                                            <td className="border-b border-wa-accent/15 px-4 py-4 font-medium text-wa-body">
                                                {r.time}
                                            </td>
                                            <td className="border-b border-wa-accent/15 px-4 py-4">
                                                <span className="inline-flex rounded-sm border border-wa-accent/25 bg-wa-card px-3 py-1 text-xs font-semibold text-wa-muted">
                                                    {r.name}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </NeonCard>

                <NeonCard elevate={false} className="p-10 sm:p-12">
                    <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">ショートカット</div>
                    <div className="mt-3 text-sm font-semibold text-wa-body">よく使う画面</div>
                    <div className="mt-10 grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-4">
                        <DashboardTileLink
                            title="社内情報"
                            description="周知事項・お知らせ"
                            href={route('notices.index')}
                            badge={{ label: 'NOTICE', variant: 'primary', pulse: true }}
                        />
                        <DashboardTileLink
                            title="各商材について"
                            description="商品一覧・トークの要点"
                            href={route('products.index')}
                            badge={{ label: 'DOC', variant: 'muted' }}
                        />
                        <DashboardTileLink
                            title="タスク管理"
                            description="依頼・進捗・期限"
                            href={route('task-requests.index')}
                            badge={{ label: 'TASK', variant: 'success' }}
                        />
                        <DashboardTileLink
                            title="マイページ"
                            description="打刻・昼休憩・設定"
                            href={route('mypage.index')}
                            badge={{ label: 'ME', variant: 'primary' }}
                        />
                    </div>
                </NeonCard>
            </div>
        </AuthenticatedLayout>
    );
}
