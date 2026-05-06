import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import NeonCard from '@/Components/NeonCard';
import SlotNumber from '@/Components/UI/SlotNumber';
import NoticeFeedItem from '@/Components/NoticeFeedItem';
import BreakRunner from '@/Components/BreakRunner';
import StatusBadge from '@/Components/StatusBadge';
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

type KpiPayload = {
    summary: { ok: number; ng: number; contract_rate: number };
};

type TaskRow = {
    id: number;
    title: string;
    requester: string;
    priority: 'urgent' | 'important' | 'normal' | string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | string;
    due_date: string;
    created_at: string;
};

function laneRemainingMs(row: LunchLaneStatus, nowMs: number, totalMs: number): number | null {
    const started = row.current?.started_at;
    if (!started) return null;
    const t0 = new Date(started).getTime();
    if (!Number.isFinite(t0)) return null;
    return Math.max(0, totalMs - (nowMs - t0));
}

function formatTime(t: string | undefined): string {
    if (!t) return '';
    return t.length >= 8 ? t.slice(0, 5) : t.length >= 5 ? t.slice(0, 5) : t;
}

const priorityLabel = (p: string): string => {
    switch (p) {
        case 'urgent': return '至急';
        case 'important': return '重要';
        case 'normal': return '順次';
        case 'high': return '至急';
        case 'medium': return '重要';
        case 'low': return '順次';
        default: return p;
    }
};

const priorityVariant = (p: string): 'danger' | 'primary' | 'muted' => {
    switch (p) {
        case 'urgent': case 'high': return 'danger';
        case 'important': case 'medium': return 'primary';
        default: return 'muted';
    }
};

const statusLabel = (s: string): string => {
    switch (s) {
        case 'pending': return '未対応';
        case 'in_progress': return '対応中';
        case 'completed': return '完了';
        case 'rejected': return '却下';
        default: return s;
    }
};

const statusVariant = (s: string): 'primary' | 'success' | 'danger' | 'muted' => {
    switch (s) {
        case 'pending': case 'in_progress': return 'primary';
        case 'completed': return 'success';
        case 'rejected': return 'danger';
        default: return 'muted';
    }
};

function parseTaskData(raw: unknown): TaskRow[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as TaskRow[];
    if (typeof raw === 'object' && raw !== null && 'data' in raw) {
        const d = (raw as { data: unknown }).data;
        if (Array.isArray(d)) return d as TaskRow[];
    }
    return [];
}

export default function Index({
    title,
    notices,
    lunchBreaks,
    kpi,
    tasks,
}: {
    title?: string;
    notices: { data: NoticeRow[]; meta?: Record<string, unknown> };
    lunchBreaks: { data: LunchSlot[]; meta?: { date?: string } };
    kpi: { data: KpiPayload; meta?: Record<string, unknown> };
    tasks?: { data: TaskRow[] } | TaskRow[];
    personalKpi?: { ok: number; ng: number; contract_rate: number };
}) {
    const pageTitle = title ?? 'ホーム';
    const { props } = usePage<PageProps>();
    const userId = props.auth?.user?.id ?? null;

    const go = (href: string) => router.visit(href, { preserveScroll: true });

    const noticeRows = notices?.data ?? [];
    const lunchSlots = lunchBreaks?.data ?? [];
    const summary = kpi?.data?.summary ?? { ok: 0, ng: 0, contract_rate: 0 };
    const personal = personalKpi ?? { ok: 0, ng: 0, contract_rate: 0 };
    const taskRows = parseTaskData(tasks);

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
        } catch { /* ignore */ }
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
            if (!e.key?.startsWith(`lunchBreakTimer:${today}:`)) return;
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

    const activeTasks = useMemo(
        () => taskRows.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
        [taskRows],
    );

    return (
        <AuthenticatedLayout
            header={
                <span className="wa-body-track text-sm font-semibold text-wa-body">ホーム</span>
            }
        >
            <Head title={pageTitle} />

            <div className="mx-auto max-w-6xl px-6 py-6 text-wa-body wa-body-track space-y-6">
                {/* ── 1. 周知事項 ── */}
                <NeonCard elevate={false} className="p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">
                                NOTICES
                            </div>
                            <div className="mt-1 text-sm font-black tracking-tight text-wa-body">
                                周知事項
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-wa-muted">
                                {noticeRows.length > 0 ? `最新 ${noticeRows.length} 件` : ''}
                            </span>
                            <button
                                type="button"
                                onClick={() => go(route('notices.index'))}
                                className="rounded-sm border border-wa-accent/25 bg-wa-subtle px-3 py-1.5 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                            >
                                すべて見る
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {noticeRows.length === 0 ? (
                            <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                表示できるお知らせはありません
                            </div>
                        ) : (
                            noticeRows.map((n) => (
                                <NoticeFeedItem
                                    key={n.id}
                                    title={n.title}
                                    body={n.body ?? undefined}
                                    publishedAt={publishedLabel(n.published_at)}
                                    isPinned={n.is_pinned}
                                    onOpen={() => go(`${route('notices.index')}?open=${n.id}`)}
                                />
                            ))
                        )}
                    </div>
                </NeonCard>

                {/* ── 2. 昼休憩 ── */}
                <NeonCard elevate={false} className="p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">
                                LUNCH BREAK
                            </div>
                            <div className="mt-1 text-sm font-black tracking-tight text-wa-body">
                                昼休憩
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {lunchBreaks?.meta?.date && (
                                <span className="text-[10px] text-wa-muted">
                                    {lunchBreaks.meta.date}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => go(route('lunch-breaks.index'))}
                                className="rounded-sm border border-wa-accent/25 bg-wa-subtle px-3 py-1.5 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                            >
                                詳細を見る
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
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

                        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-4">
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
                            <div className="mt-3 h-2 w-full bg-wa-subtle">
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

                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-sm">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-wa-muted">
                                        <th className="border-b border-wa-accent/20 px-4 py-2">
                                            時間
                                        </th>
                                        <th className="border-b border-wa-accent/20 px-4 py-2">
                                            休憩者
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lunchTableRows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={2}
                                                className="border-b border-wa-accent/15 px-4 py-4 text-wa-muted"
                                            >
                                                本日の枠はありません
                                            </td>
                                        </tr>
                                    ) : (
                                        lunchTableRows.map((r) => (
                                            <tr
                                                key={r.time}
                                                className="transition-colors hover:bg-wa-ink/80"
                                            >
                                                <td className="border-b border-wa-accent/15 px-4 py-3 font-medium text-wa-body">
                                                    {r.time}
                                                </td>
                                                <td className="border-b border-wa-accent/15 px-4 py-3">
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
                    </div>
                </NeonCard>

                {/* ── 3. KPI ── */}
                <NeonCard elevate={false} className="p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">KPI</div>
                            <div className="mt-1 text-sm font-black tracking-tight text-wa-body">
                                今月の実績
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => go(route('sales.summary'))}
                            className="rounded-sm border border-wa-accent/25 bg-wa-subtle px-3 py-1.5 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                        >
                            詳細を見る
                        </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Team KPI */}
                        <div>
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-wa-muted">
                                チーム全体
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    {
                                        label: '契約率',
                                        value: String(summary.contract_rate),
                                        suffix: '%',
                                        valClass: 'text-wa-body',
                                    },
                                    {
                                        label: 'OK',
                                        value: String(summary.ok),
                                        suffix: '',
                                        valClass: 'text-teal-300',
                                    },
                                    {
                                        label: 'NG',
                                        value: String(summary.ng),
                                        suffix: '',
                                        valClass: 'text-red-400',
                                    },
                                ].map((k) => (
                                    <div
                                        key={`team-${k.label}`}
                                        className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-5"
                                    >
                                        <div className="text-[10px] font-semibold uppercase tracking-wide text-wa-muted">
                                            {k.label}
                                        </div>
                                        <div className={`wa-nums mt-1.5 text-xl font-semibold tabular-nums ${k.valClass}`}>
                                            <SlotNumber value={k.value} />
                                            {k.suffix}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Personal KPI */}
                        <div>
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-wa-muted">
                                個人成績
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    {
                                        label: '契約率',
                                        value: String(personal.contract_rate),
                                        suffix: '%',
                                        valClass: 'text-wa-body',
                                    },
                                    {
                                        label: 'OK',
                                        value: String(personal.ok),
                                        suffix: '',
                                        valClass: 'text-teal-300',
                                    },
                                    {
                                        label: 'NG',
                                        value: String(personal.ng),
                                        suffix: '',
                                        valClass: 'text-red-400',
                                    },
                                ].map((k) => (
                                    <div
                                        key={`personal-${k.label}`}
                                        className="rounded-sm border border-teal-500/20 bg-wa-ink px-4 py-5"
                                    >
                                        <div className="text-[10px] font-semibold uppercase tracking-wide text-wa-muted">
                                            {k.label}
                                        </div>
                                        <div className={`wa-nums mt-1.5 text-xl font-semibold tabular-nums ${k.valClass}`}>
                                            <SlotNumber value={k.value} />
                                            {k.suffix}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </NeonCard>

                {/* ── 4. タスク管理 ── */}
                <NeonCard elevate={false} className="p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">
                                TASKS
                            </div>
                            <div className="mt-1 text-sm font-black tracking-tight text-wa-body">
                                タスク管理
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-wa-muted">
                                {activeTasks.length > 0
                                    ? `未完了 ${activeTasks.length} 件`
                                    : ''}
                            </span>
                            <button
                                type="button"
                                onClick={() => go(route('task-requests.index'))}
                                className="rounded-sm border border-wa-accent/25 bg-wa-subtle px-3 py-1.5 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                            >
                                すべて見る
                            </button>
                        </div>
                    </div>

                    {activeTasks.length === 0 ? (
                        <div className="mt-5 rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                            未対応のタスクはありません
                        </div>
                    ) : (
                        <div className="mt-5 space-y-3">
                            {activeTasks.map((t) => (
                                <div
                                    key={t.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => go(route('task-requests.index'))}
                                    onKeyDown={(e) => {
                                        if (e.key !== 'Enter' && e.key !== ' ') return;
                                        e.preventDefault();
                                        go(route('task-requests.index'));
                                    }}
                                    className="group rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-4 transition hover:border-wa-accent/35 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge variant={priorityVariant(t.priority)}>
                                                    {priorityLabel(t.priority)}
                                                </StatusBadge>
                                                <StatusBadge variant={statusVariant(t.status)}>
                                                    {statusLabel(t.status)}
                                                </StatusBadge>
                                            </div>
                                            <div className="mt-2 text-sm font-black tracking-tight text-wa-body">
                                                {t.title}
                                            </div>
                                            <div className="mt-1 text-xs text-wa-muted">
                                                依頼元: {t.requester} / 期限: {t.due_date}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-[10px] text-wa-muted">
                                            #{t.id}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </NeonCard>
            </div>
        </AuthenticatedLayout>
    );
}
