import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import NeonCard from '@/Components/NeonCard';
import SlotNumber from '@/Components/UI/SlotNumber';
import NoticeFeedItem from '@/Components/NoticeFeedItem';
import BreakRunner from '@/Components/BreakRunner';
import StatusBadge from '@/Components/StatusBadge';
import { PageProps } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SectionHeader from '@/Components/UI/SectionHeader';

type LunchLaneStatus = {
    lane: number;
    current: {
        user: { id: number; name: string } | null;
        started_at?: string | null;
        duration_minutes?: number;
    };
    next?: { user: { id: number; name: string } | null };
};

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

function formatTime(t: string | undefined | null): string {
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
    personalKpi,
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
            const label = names.length > 0 ? names[0] : '—';
            return {
                time: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
                name: label,
            };
        });
    }, [lunchSlots]);

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const totalMs = 60 * 60 * 1000;
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
        const id = window.setInterval(() => void fetchLunchStatus(), 5000);
        return () => window.clearInterval(id);
    }, [fetchLunchStatus]);

    useEffect(() => {
        const onUpdated = (e: Event) => {
            const d = (e as CustomEvent<{ date?: string }>).detail;
            if (d?.date && d.date !== today) return;
            void fetchLunchStatus();
        };
        window.addEventListener('lunch-schedule-updated', onUpdated as EventListener);
        return () => window.removeEventListener('lunch-schedule-updated', onUpdated as EventListener);
    }, [fetchLunchStatus, today]);

    useEffect(() => {
        const tick = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(tick);
    }, []);

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

            <div className="mx-auto max-w-6xl text-wa-body wa-body-track space-y-6">
                {/* ── 1. 周知事項 ── */}
                <NeonCard elevate={false} className="p-8">
                    <SectionHeader
                        eyebrow="NOTICES"
                        title="周知事項"
                        meta={noticeRows.length > 0 ? `最新 ${noticeRows.length} 件` : ''}
                        action={{ label: 'すべて見る', onClick: () => go(route('notices.index')), variant: 'secondary' }}
                    />

                    <div className="mt-5 space-y-3">
                        {noticeRows.length === 0 ? (
                            <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
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
                    <SectionHeader
                        eyebrow="LUNCH BREAK"
                        title="昼休憩"
                        meta={lunchBreaks?.meta?.date ?? ''}
                        action={{ label: '詳細を見る', onClick: () => go(route('lunch-breaks.index')), variant: 'secondary' }}
                    />

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="space-y-3">
                            {[1, 2, 3].map((lane) => {
                                const row = lanesFromApi.find((r) => r.lane === lane) ?? null;
                                const rem = row ? laneRemainingMs(row, nowMs, totalMs) : null;
                                const active = rem !== null && rem > 0 && rem < totalMs;
                                const currentName = row?.current?.user?.name ?? '—';
                                const nextName = row?.next?.user?.name ?? '—';
                                return (
                                    <BreakRunner
                                        key={lane}
                                        active={active}
                                        remainingMs={active ? rem! : totalMs}
                                        totalMs={totalMs}
                                        label={`枠${lane}: ${currentName}（次: ${nextName}）`}
                                    />
                                );
                            })}
                        </div>

                        <div className="rounded-xl border border-wa-accent/15 bg-wa-ink p-4">
                            <table className="w-full border-separate border-spacing-0 text-sm">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-wa-muted">
                                        <th className="border-b border-wa-accent/15 px-3 py-2">時間帯</th>
                                        <th className="border-b border-wa-accent/15 px-3 py-2">担当者</th>
                                        <th className="border-b border-wa-accent/15 px-3 py-2">ステータス</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lunchTableRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-4 text-wa-muted">
                                                本日の枠がありません
                                            </td>
                                        </tr>
                                    ) : (
                                        lunchTableRows.map((r, i) => {
                                            const laneData = lanesFromApi.find((l) => l.current?.user?.name === r.name);
                                            const isActive = laneData?.current?.started_at != null;
                                            return (
                                                <tr key={i} className="transition-colors hover:bg-wa-card/20">
                                                    <td className="border-b border-wa-accent/10 px-3 py-2 font-medium text-wa-body">
                                                        {r.time}
                                                    </td>
                                                    <td className="border-b border-wa-accent/10 px-3 py-2 text-wa-body">
                                                        {r.name}
                                                    </td>
                                                    <td className="border-b border-wa-accent/10 px-3 py-2">
                                                        <span className={`text-xs font-semibold ${isActive ? 'text-wa-accent' : 'text-wa-muted'}`}>
                                                            {isActive ? '休憩中' : '未開始'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </NeonCard>

                {/* ── 3. KPI ── */}
                <NeonCard elevate={false} className="p-8">
                    <SectionHeader
                        eyebrow="KPI"
                        title="今月の実績"
                        action={{ label: '詳細を見る', onClick: () => go(route('sales.summary')), variant: 'secondary' }}
                    />

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
                                        className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-5"
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
                                        className="rounded-xl border border-teal-500/18 bg-wa-ink px-4 py-5"
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
                    <SectionHeader
                        eyebrow="TASKS"
                        title="タスク管理"
                        meta={activeTasks.length > 0 ? `未完了 ${activeTasks.length} 件` : ''}
                        action={{ label: 'すべて見る', onClick: () => go(route('task-requests.index')), variant: 'secondary' }}
                    />

                    {activeTasks.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
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
                                    className="group cursor-pointer rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-4 transition hover:border-wa-accent/30"
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
