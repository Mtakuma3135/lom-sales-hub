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
        planned_start_time?: string | null;
        duration_minutes?: number;
    };
    next?: { user: { id: number; name: string } | null };
};

type KpiPayload = {
    summary: { ok: number; ng: number; contract_rate: number; contract_message?: string | null };
};

type TaskRow = {
    id: number;
    title: string;
    requester: string;
    priority: 'urgent' | 'important' | 'normal' | string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | string;
    due_date: string;
    created_at: string;
    to_user_id?: number | null;
};

type DailyTaskRow = {
    id: number;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | string;
};

function laneRemainingMs(row: LunchLaneStatus, nowMs: number, totalMs: number): number | null {
    const started = row.current?.started_at;
    if (!started) return null;
    const t0 = new Date(started).getTime();
    if (!Number.isFinite(t0)) return null;
    return Math.max(0, totalMs - (nowMs - t0));
}

function parseIsoMs(raw: unknown): number | null {
    if (typeof raw !== 'string' || raw.length === 0) return null;
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? ms : null;
}

function formatTime(t: string | undefined): string {
    if (!t) return '';
    return t.length >= 8 ? t.slice(0, 5) : t.length >= 5 ? t.slice(0, 5) : t;
}

function addMinutesHHMM(hhmm: string, minutes: number): string {
    const [h, m] = hhmm.split(':').map((x) => Number(x));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
    const total = h * 60 + m + minutes;
    const hh = String(Math.floor((total + 1440) % 1440 / 60)).padStart(2, '0');
    const mm = String(((total + 1440) % 1440) % 60).padStart(2, '0');
    return `${hh}:${mm}`;
}

function localYmd(d: Date = new Date()): string {
    // sv-SE gives YYYY-MM-DD in local timezone
    return d.toLocaleDateString('sv-SE');
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

const statusVariant = (s: string): 'primary' | 'success' | 'danger' | 'muted' | 'warning' => {
    switch (s) {
        case 'pending': return 'warning';
        case 'in_progress': return 'primary';
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
    dailyTasks,
    personalKpi,
    serverMeta,
}: {
    title?: string;
    notices: { data: NoticeRow[]; meta?: Record<string, unknown> };
    lunchBreaks: { data: LunchSlot[]; meta?: { date?: string; server_time?: string } };
    kpi: { data: KpiPayload; meta?: Record<string, unknown> };
    tasks?: { data: TaskRow[] } | TaskRow[];
    dailyTasks?: DailyTaskRow[];
    personalKpi?: { ok: number; ng: number; contract_rate: number; contract_message?: string | null };
    serverMeta?: { server_time?: string; date?: string };
}) {
    const pageTitle = title ?? 'ホーム';
    const { props } = usePage<PageProps>();
    const userId = props.auth?.user?.id ?? null;

    const go = (href: string) => router.visit(href, { preserveScroll: true });

    const noticeRows = notices?.data ?? [];
    const noticeRowsSorted = useMemo(() => {
        const rows = [...noticeRows];
        rows.sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) {
                return a.is_pinned ? -1 : 1;
            }
            const ta = parseIsoMs(a.published_at ?? null) ?? 0;
            const tb = parseIsoMs(b.published_at ?? null) ?? 0;
            return tb - ta;
        });
        return rows;
    }, [noticeRows]);
    const noticeDisplay = noticeRowsSorted;
    const lunchSlots = lunchBreaks?.data ?? [];
    const summary = kpi?.data?.summary ?? { ok: 0, ng: 0, contract_rate: 0, contract_message: null };
    const personal = personalKpi ?? { ok: 0, ng: 0, contract_rate: 0, contract_message: null };
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

    const dateYmd = useMemo(
        () => lunchBreaks?.meta?.date ?? serverMeta?.date ?? localYmd(),
        [lunchBreaks?.meta?.date, serverMeta?.date],
    );
    const totalMs = 60 * 60 * 1000;
    const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [lanesFromApi, setLanesFromApi] = useState<LunchLaneStatus[]>([]);

    const fetchLunchStatus = useCallback(async () => {
        try {
            const url = `${route('portal.api.lunch-breaks.status')}?date=${encodeURIComponent(dateYmd)}`;
            const res = await fetch(url, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const json = (await res.json()) as {
                data?: { active?: LunchLaneStatus[] };
                meta?: { server_time?: string };
            };
            const rows = (json as any)?.data?.active;
            setLanesFromApi(Array.isArray(rows) ? (rows as LunchLaneStatus[]) : []);

            const serverMs = parseIsoMs((json as any)?.meta?.server_time);
            if (serverMs !== null) {
                setServerOffsetMs(serverMs - Date.now());
            }
        } catch { /* ignore */ }
    }, [dateYmd]);

    useEffect(() => {
        const st = parseIsoMs(serverMeta?.server_time);
        if (st !== null) {
            setServerOffsetMs(st - Date.now());
        }
    }, [serverMeta?.server_time]);

    useEffect(() => {
        void fetchLunchStatus();
        const id = window.setInterval(() => void fetchLunchStatus(), 5000);
        return () => window.clearInterval(id);
    }, [fetchLunchStatus]);

    useEffect(() => {
        const onUpdated = (e: Event) => {
            const d = (e as CustomEvent<{ date?: string }>).detail;
            if (d?.date && d.date !== dateYmd) return;
            void fetchLunchStatus();
        };
        window.addEventListener('lunch-schedule-updated', onUpdated as EventListener);
        window.addEventListener('lunch-break-timer-updated', onUpdated as EventListener);
        return () => {
            window.removeEventListener('lunch-schedule-updated', onUpdated as EventListener);
            window.removeEventListener('lunch-break-timer-updated', onUpdated as EventListener);
        };
    }, [fetchLunchStatus, dateYmd]);

    useEffect(() => {
        const id = window.setInterval(() => setNowMs(Date.now() + serverOffsetMs), 1000);
        return () => window.clearInterval(id);
    }, [serverOffsetMs]);

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

    const dailyRows = Array.isArray(dailyTasks) ? dailyTasks : [];

    const homeSortedTasks = useMemo(() => {
        const uid = userId ?? -1;
        const activeRank = (s: string) =>
            s === 'pending' || s === 'in_progress' || s === 'rejected' ? 0 : 1;
        return [...taskRows].sort((a, b) => {
            const ar = activeRank(a.status);
            const br = activeRank(b.status);
            if (ar !== br) return ar - br;
            const aMine = (a.to_user_id ?? -1) === uid;
            const bMine = (b.to_user_id ?? -1) === uid;
            if (aMine !== bMine) return aMine ? -1 : 1;
            const prio = (p: string) => (p === 'urgent' || p === 'high' ? 0 : p === 'important' || p === 'medium' ? 1 : 2);
            const ap = prio(a.priority);
            const bp = prio(b.priority);
            if (ap !== bp) return ap - bp;
            return String(b.created_at).localeCompare(String(a.created_at));
        });
    }, [taskRows, userId]);

    const myTaskCount = useMemo(
        () =>
            homeSortedTasks.filter(
                (t) =>
                    (t.to_user_id ?? 0) === (userId ?? -2) &&
                    (t.status === 'pending' || t.status === 'in_progress'),
            ).length,
        [homeSortedTasks, userId],
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
                        meta={noticeDisplay.length > 0 ? `${noticeDisplay.length} 件（新しい順）` : ''}
                        action={{ label: 'すべて見る', onClick: () => go(route('notices.index')), variant: 'secondary' }}
                    />

                    <div className="mt-5 max-h-[min(420px,55vh)] space-y-3 overflow-y-auto overflow-x-hidden pr-1">
                        {noticeDisplay.length === 0 ? (
                            <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                表示できるお知らせはありません
                            </div>
                        ) : (
                            noticeDisplay.map((n) => (
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

                    <div className="mt-5 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {[1, 2, 3, 4, 5].map((lane) => {
                                const row = lanesFromApi.find((r) => r.lane === lane) ?? null;
                                const rem = row ? laneRemainingMs(row, nowMs, totalMs) : null;
                                const active = rem !== null && rem > 0 && rem < totalMs;
                                const currentName = row?.current?.user?.name ?? '—';
                                const nextName = row?.next?.user?.name ?? '—';
                                const plannedStart = row?.current?.planned_start_time ?? null;
                                const plannedLabel = plannedStart
                                    ? `${plannedStart} - ${addMinutesHHMM(plannedStart, 60)}`
                                    : null;
                                return (
                                    <div key={lane} className="rounded-xl border border-wa-accent/15 bg-wa-ink p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="text-sm font-black tracking-tight text-wa-body">{lane}</div>
                                            <div className="text-[11px] font-medium text-wa-muted">{plannedLabel ?? '—'}</div>
                                        </div>
                                        <div className="mt-2 text-lg font-black tracking-tight text-wa-body">{currentName}</div>
                                        <div className="mt-1 text-[11px] text-wa-muted">次: {nextName}</div>

                                        <div className="mt-3">
                                            <BreakRunner
                                                active={active}
                                                remainingMs={active ? rem! : totalMs}
                                                totalMs={totalMs}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
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

                    <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Team KPI — contract rate hero */}
                        <div className="rounded-2xl border border-wa-accent/25 bg-gradient-to-br from-wa-ink via-wa-card to-wa-ink p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-wa-muted">
                                    チーム全体
                                </div>
                                <span className="rounded-full border border-wa-accent/20 bg-wa-ink/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-wa-muted">
                                    CSV取込ベース
                                </span>
                            </div>
                            {summary.contract_message ? (
                                <div className="mt-6 text-sm font-medium leading-relaxed text-wa-muted">
                                    {summary.contract_message}
                                </div>
                            ) : (
                                <>
                                    <div className="mt-4 flex flex-wrap items-end gap-3">
                                        <div className="wa-nums text-5xl font-black tabular-nums tracking-tight text-wa-body sm:text-6xl">
                                            <SlotNumber value={String(summary.contract_rate)} />
                                            <span className="text-2xl font-bold text-wa-muted">%</span>
                                        </div>
                                        <div className="pb-1 text-xs text-wa-muted">契約率（今月）</div>
                                    </div>
                                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-wa-ink ring-1 ring-wa-accent/15">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-teal-400 via-wa-accent to-sky-400 transition-[width] duration-700 ease-out"
                                            style={{ width: `${Math.min(100, Math.max(0, summary.contract_rate))}%` }}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="mt-5 flex flex-wrap gap-3">
                                <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-wa-muted">OK</div>
                                    <div className="wa-nums mt-1 text-lg font-semibold tabular-nums text-teal-300">
                                        <SlotNumber value={String(summary.ok)} />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-wa-muted">NG</div>
                                    <div className="wa-nums mt-1 text-lg font-semibold tabular-nums text-red-400">
                                        <SlotNumber value={String(summary.ng)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal KPI（チーム側とトーンを揃え、白っぽい枠を避ける） */}
                        <div className="rounded-2xl border border-wa-accent/25 bg-gradient-to-br from-wa-ink via-wa-card to-wa-ink p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-wa-muted">
                                    個人成績
                                </div>
                                <span className="rounded-full border border-wa-accent/20 bg-wa-ink/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-wa-muted">
                                    担当者名一致
                                </span>
                            </div>
                            {personal.contract_message ? (
                                <div className="mt-6 text-sm font-medium leading-relaxed text-wa-muted">
                                    {personal.contract_message}
                                </div>
                            ) : (
                                <>
                                    <div className="mt-4 flex flex-wrap items-end gap-3">
                                        <div className="wa-nums text-4xl font-black tabular-nums tracking-tight text-wa-body sm:text-5xl">
                                            <SlotNumber value={String(personal.contract_rate)} />
                                            <span className="text-xl font-bold text-wa-muted">%</span>
                                        </div>
                                        <div className="pb-1 text-xs text-wa-muted">契約率（今月）</div>
                                    </div>
                                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-wa-ink ring-1 ring-wa-accent/15">
                                        <div
                                            className="h-full rounded-full bg-wa-accent/80 transition-[width] duration-700 ease-out"
                                            style={{ width: `${Math.min(100, Math.max(0, personal.contract_rate))}%` }}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="mt-5 flex flex-wrap gap-3">
                                <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-wa-muted">OK</div>
                                    <div className="wa-nums mt-1 text-lg font-semibold tabular-nums text-teal-300">
                                        <SlotNumber value={String(personal.ok)} />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-wa-muted">NG</div>
                                    <div className="wa-nums mt-1 text-lg font-semibold tabular-nums text-red-400">
                                        <SlotNumber value={String(personal.ng)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </NeonCard>

                {/* ── 4. タスク管理（業務依頼 全ステータス + 責タスク） ── */}
                <NeonCard elevate={false} className="p-8">
                    <SectionHeader
                        eyebrow="TASKS"
                        title="タスク管理"
                        meta={
                            [
                                homeSortedTasks.length > 0 ? `業務依頼 ${homeSortedTasks.length} 件` : null,
                                dailyRows.length > 0 ? `責タスク ${dailyRows.length} 件` : null,
                            ]
                                .filter(Boolean)
                                .join(' · ') || undefined
                        }
                        action={{ label: 'すべて見る', onClick: () => go(route('task-requests.index')), variant: 'secondary' }}
                    />
                    {myTaskCount > 0 ? (
                        <p className="mt-2 text-sm text-wa-muted">
                            あなた宛の未完了が{' '}
                            <span className="font-black tabular-nums text-wa-accent">{myTaskCount}</span> 件あります
                        </p>
                    ) : null}

                    <div className="mt-5 space-y-8">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">業務依頼</div>
                            {homeSortedTasks.length === 0 ? (
                                <div className="mt-3 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                    業務依頼はありません
                                </div>
                            ) : (
                                <div className="mt-3 max-h-[min(320px,45vh)] space-y-3 overflow-y-auto overflow-x-hidden pr-1">
                                    {homeSortedTasks.map((t) => (
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
                                                    <div className="flex flex-wrap items-center gap-2">
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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-wa-accent/15 pt-6">
                            <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">責タスク（今日）</div>
                            {dailyRows.length === 0 ? (
                                <div className="mt-3 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                    今日の責タスクはありません
                                </div>
                            ) : (
                                <ul className="mt-3 max-h-[min(220px,35vh)] space-y-2 overflow-y-auto pr-1">
                                    {dailyRows.map((d) => (
                                        <li
                                            key={d.id}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3 text-sm"
                                        >
                                            <span
                                                className={
                                                    d.status === 'completed'
                                                        ? 'min-w-0 flex-1 text-wa-muted line-through'
                                                        : 'min-w-0 flex-1 font-medium text-wa-body'
                                                }
                                            >
                                                {d.title}
                                            </span>
                                            <StatusBadge variant={statusVariant(d.status)}>{statusLabel(d.status)}</StatusBadge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="mt-3 text-xs text-wa-muted">チェックの更新はタスク管理の「責タスク」タブから行えます。</p>
                        </div>
                    </div>
                </NeonCard>
            </div>
        </AuthenticatedLayout>
    );
}
