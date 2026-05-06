import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import NordicCard from '@/Components/UI/NordicCard';
import BreakRunner from '@/Components/BreakRunner';
import SectionHeader from '@/Components/UI/SectionHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { showAppToast } from '@/lib/toast';

type Cell = {
    lane: number;
    user: { id: number; name: string } | null;
    reservation_id: number | null;
};

type TimetableRow = {
    time: string;
    end: string;
    cells: Cell[];
};

type Timetable = {
    rows: TimetableRow[];
    lanes: number;
    day_start: string;
    day_end: string;
};

type UserOption = {
    id: number;
    name: string;
    employee_code: string | null;
    role: string;
};

type ActiveRow = {
    lane: number;
    current: {
        user: { id: number; name: string } | null;
        planned_start_time?: string | null;
        started_at?: string | null;
        finished_at?: string | null;
        duration_minutes?: number;
    };
    next?: { user: { id: number; name: string } | null };
};

function addMinutesHHMM(hhmm: string, minutes: number): string {
    const [h, m] = hhmm.split(':').map((x) => Number(x));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
    const total = h * 60 + m + minutes;
    const hh = String(Math.floor((total + 1440) % 1440 / 60)).padStart(2, '0');
    const mm = String(((total + 1440) % 1440) % 60).padStart(2, '0');
    return `${hh}:${mm}`;
}

function cellKey(time: string, lane: number): string {
    return `${time}_${lane}`;
}

function currentBlockStart(d: Date): string {
    const h = d.getHours();
    const m = d.getMinutes();
    const block = m < 30 ? 0 : 30;
    return `${String(h).padStart(2, '0')}:${String(block).padStart(2, '0')}`;
}

export default function Index({
    date: dateProp,
    timetable,
    users,
    myAssignment,
    serverNow,
}: {
    date?: string;
    timetable?: Timetable;
    users?: { data: UserOption[] };
    myAssignment?: { start_time: string; end_time: string } | null;
    serverNow?: string;
}) {
    const { props } = usePage<PageProps>();
    const actorId = props.auth?.user?.id ?? null;
    const isAdmin = props.auth?.user?.role === 'admin';
    const clientToday = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const date = dateProp ?? clientToday;

    const rows = timetable?.rows ?? [];
    const lanes = timetable?.lanes ?? 5;

    const [selections, setSelections] = useState<Record<string, number>>({});
    const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
    const [tick, setTick] = useState(() => Date.now());
    const [activeRows, setActiveRows] = useState<ActiveRow[]>([]);

    /** サーバー値の正規化（表示用） */
    useEffect(() => {
        const next: Record<string, number> = {};
        rows.forEach((row) => {
            row.cells.forEach((c) => {
                next[cellKey(row.time, c.lane)] = c.user?.id ?? 0;
            });
        });
        for (let lane = 1; lane <= lanes; lane++) {
            for (let i = 0; i < rows.length - 1; i += 2) {
                const u = next[cellKey(rows[i].time, lane)] ?? 0;
                next[cellKey(rows[i + 1].time, lane)] = u > 0 ? u : 0;
            }
        }
        setSelections(next);
    }, [rows, lanes]);

    useEffect(() => {
        const t = window.setInterval(() => setTick(Date.now() + serverOffsetMs), 1000);
        return () => window.clearInterval(t);
    }, [serverOffsetMs]);

    const fetchStatus = useCallback(async () => {
        try {
            const url = `${route('portal.api.lunch-breaks.status')}?date=${encodeURIComponent(date)}`;
            const res = await fetch(url, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const json = (await res.json()) as {
                data?: { active?: ActiveRow[] };
                meta?: { server_time?: string };
            };
            setActiveRows(Array.isArray(json.data?.active) ? json.data!.active! : []);

            const ms = typeof json.meta?.server_time === 'string' ? new Date(json.meta.server_time).getTime() : NaN;
            if (Number.isFinite(ms)) {
                setServerOffsetMs(ms - Date.now());
            }
        } catch {
            /* ignore */
        }
    }, [date]);

    useEffect(() => {
        void fetchStatus();
        const id = window.setInterval(() => void fetchStatus(), 5000);
        return () => window.clearInterval(id);
    }, [fetchStatus]);

    const isLockedTail = useCallback(
        (rowIdx: number, lane: number): boolean => {
            if (rowIdx <= 0) return false;
            if (rowIdx % 2 === 0) return false;
            const prevU = selections[cellKey(rows[rowIdx - 1].time, lane)] ?? 0;
            return prevU > 0;
        },
        [rows, selections],
    );

    const canStartHourBlock = (rowIdx: number): boolean => rowIdx < rows.length - 1;

    const effectiveUserId = useCallback(
        (rowIdx: number, lane: number): number => {
            if (isLockedTail(rowIdx, lane)) {
                return selections[cellKey(rows[rowIdx - 1].time, lane)] ?? 0;
            }
            return selections[cellKey(rows[rowIdx].time, lane)] ?? 0;
        },
        [rows, selections, isLockedTail],
    );

    const applyLaneSelection = (rowIdx: number, lane: number, newVal: number) => {
        if (isLockedTail(rowIdx, lane)) return;
        if (newVal > 0 && !canStartHourBlock(rowIdx)) return;

        setSelections((prev) => {
            const next = { ...prev };
            const k = cellKey(rows[rowIdx].time, lane);
            const old = prev[k] ?? 0;
            next[k] = newVal;
            // 自動で次行に伝播させない（2時間に伸びる強制を解除）
            if (newVal === 0 && rowIdx + 1 < rows.length) {
                const nk = cellKey(rows[rowIdx + 1].time, lane);
                if (old > 0 && (prev[nk] ?? 0) === old) {
                    next[nk] = 0;
                }
            }
            return next;
        });
    };

    const [saving, setSaving] = useState(false);

    const buildCellsPayload = useCallback(() => {
        const cells: { time: string; lane: number; user_id: number | null }[] = [];
        rows.forEach((row, rowIdx) => {
            for (let lane = 1; lane <= lanes; lane++) {
                const id = effectiveUserId(rowIdx, lane);
                cells.push({
                    time: row.time,
                    lane,
                    user_id: id > 0 ? id : null,
                });
            }
        });
        return cells;
    }, [rows, lanes, effectiveUserId]);

    const onSave = () => {
        setSaving(true);
        router.post(
            route('lunch-breaks.grid-sync'),
            { date, cells: buildCellsPayload() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showAppToast('保存しました');
                    window.dispatchEvent(new CustomEvent('lunch-schedule-updated', { detail: { date } }));
                },
                onError: () => {
                    showAppToast('保存に失敗しました');
                },
                onFinish: () => {
                    setSaving(false);
                    void fetchStatus();
                },
            },
        );
    };

    const nowDate = useMemo(() => new Date(tick), [tick]);
    const blockStart = currentBlockStart(nowDate);
    const alertSeconds = 12;
    const rowIsAlert = (rowTime: string) =>
        rowTime === blockStart && nowDate.getSeconds() < alertSeconds;

    const laneLabels = ['休憩枠 1', '休憩枠 2', '休憩枠 3', '休憩枠 4', '休憩枠 5'];
    const laneAccent: Record<number, 'emerald' | 'sky' | 'amber'> = { 1: 'emerald', 2: 'sky', 3: 'amber', 4: 'emerald', 5: 'sky' };

    const csrf = () =>
        (document.querySelector('meta[name=\"csrf-token\"]') as HTMLMetaElement)?.content ?? '';

    const postJson = async (url: string, body: any) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf(),
            },
            credentials: 'same-origin',
            body: JSON.stringify(body),
        });
        return res.ok;
    };

    const startLane = async (lane: number) => {
        await postJson(route('portal.api.lunch-breaks.start'), { date, lane });
        void fetchStatus();
        window.dispatchEvent(new CustomEvent('lunch-schedule-updated', { detail: { date } }));
    };

    const stopLane = async (lane: number) => {
        await postJson(route('portal.api.lunch-breaks.stop'), { date, lane });
        void fetchStatus();
        window.dispatchEvent(new CustomEvent('lunch-schedule-updated', { detail: { date } }));
    };

    const resetLane = async (lane: number) => {
        await postJson(route('portal.api.lunch-breaks.reset'), { date, lane });
        void fetchStatus();
        window.dispatchEvent(new CustomEvent('lunch-schedule-updated', { detail: { date } }));
    };

    const remainingFor = (row: ActiveRow): number | null => {
        const started = row.current?.started_at ?? null;
        if (!started) return null;
        const t0 = new Date(started).getTime();
        if (!Number.isFinite(t0)) return null;
        const total = (row.current?.duration_minutes ?? 60) * 60 * 1000;
        return Math.max(0, total - (tick - t0));
    };

    const hourPairs = useMemo(() => {
        const out: { hourLabel: string; segments: { row: TimetableRow; idx: number }[] }[] = [];
        for (let i = 0; i < rows.length; i += 2) {
            const segments: { row: TimetableRow; idx: number }[] = [{ row: rows[i], idx: i }];
            if (i + 1 < rows.length) {
                segments.push({ row: rows[i + 1], idx: i + 1 });
            }
            out.push({
                hourLabel: rows[i].time.slice(0, 5),
                segments,
            });
        }
        return out;
    }, [rows]);

    const totalMs = 60 * 60 * 1000;

    const compactSlots = useMemo(() => {
        // 60分 = 2行を1枠としてまとめ、開始行の割当を表示する
        const out: Array<{ time: string; byLane: Array<{ lane: number; name: string }> }> = [];
        for (let i = 0; i < rows.length; i += 2) {
            const start = rows[i];
            const end = rows[Math.min(i + 1, rows.length - 1)];
            const time = `${start.time.slice(0, 5)} - ${end.end.slice(0, 5)}`;
            const byLane = Array.from({ length: lanes }, (_, idx) => {
                const lane = idx + 1;
                const id = effectiveUserId(i, lane);
                const name =
                    id > 0 ? (users?.data ?? []).find((u) => u.id === id)?.name ?? '—' : '—';
                return { lane, name };
            });
            out.push({ time, byLane });
        }
        return out;
    }, [rows, lanes, effectiveUserId, users?.data]);

    const laneRunState = useMemo(() => {
        const byLane: Record<number, { remainingMs: number | null; active: boolean }> = {};
        for (let lane = 1; lane <= lanes; lane++) {
            const row = activeRows.find((r) => r.lane === lane) ?? null;
            const rem = row ? remainingFor(row) : null;
            byLane[lane] = { remainingMs: rem, active: rem !== null && rem > 0 };
        }
        return byLane;
    }, [activeRows, lanes, tick]);

    const hourBlocks = useMemo(() => {
        // 上テーブル用: 60分単位(=2行)で rowIdx を持つ
        return compactSlots.map((s, idx) => ({
            ...s,
            rowIdx: idx * 2,
        }));
    }, [compactSlots]);

    const selectedUserIds = useMemo(() => {
        // 同一ユーザーを複数枠に割り当て不可（バックエンド制約に合わせる）
        const ids: number[] = [];
        hourBlocks.forEach((b) => {
            for (let lane = 1; lane <= lanes; lane++) {
                const id = effectiveUserId(b.rowIdx, lane);
                if (id > 0) ids.push(id);
            }
        });
        return new Set(ids);
    }, [hourBlocks, lanes, effectiveUserId]);

    return (
        <AuthenticatedLayout header={<h2 className="wa-body-track text-sm font-semibold text-wa-body">昼休憩</h2>}>
            <Head title="昼休憩" />

            <div className="mx-auto max-w-6xl text-wa-body wa-body-track space-y-6">
                <NordicCard elevate={false}>
                    <SectionHeader
                        eyebrow="LUNCH BREAK"
                        title="昼休憩"
                        meta={date}
                        action={{
                            label: 'ホームに戻る',
                            onClick: () => router.visit(route('home')),
                            variant: 'secondary',
                        }}
                    />

                    <div className="mt-5 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {Array.from({ length: lanes }, (_, idx) => idx + 1).map((lane) => {
                                const row = activeRows.find((r) => r.lane === lane) ?? null;
                                const remaining = laneRunState[lane]?.remainingMs ?? null;
                                const active = laneRunState[lane]?.active ?? false;
                                const currentName = row?.current?.user?.name ?? '—';
                                const nextName = row?.next?.user?.name ?? '—';
                                const plannedStart = row?.current?.planned_start_time ?? null;
                                const plannedLabel = plannedStart ? `${plannedStart} - ${addMinutesHHMM(plannedStart, 60)}` : null;

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
                                                remainingMs={remaining ?? totalMs}
                                                totalMs={totalMs}
                                                accent={laneAccent[lane]}
                                            />
                                        </div>
                                        <div className="mt-3 grid gap-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <PrimaryButton onClick={() => startLane(lane)} className="w-full justify-center whitespace-nowrap px-3 py-2 text-[11px]">
                                                    スタート
                                                </PrimaryButton>
                                                <SecondaryButton onClick={() => stopLane(lane)} className="w-full justify-center whitespace-nowrap px-3 py-2 text-[11px]">
                                                    ストップ
                                                </SecondaryButton>
                                            </div>
                                            <SecondaryButton onClick={() => resetLane(lane)} className="w-full justify-center whitespace-nowrap px-3 py-2 text-[11px]">
                                                リセット
                                            </SecondaryButton>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="rounded-xl border border-wa-accent/15 bg-wa-ink p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-bold tracking-widest text-wa-muted">ASSIGN</div>
                            </div>
                            <div className="mt-1 text-sm font-black tracking-tight text-wa-body">枠ごとの割当</div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full border-separate border-spacing-0 text-sm">
                                        <thead>
                                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-wa-muted">
                                                <th className="border-b border-wa-accent/15 px-3 py-2">時間帯</th>
                                                {Array.from({ length: lanes }, (_, i) => (
                                                    <th key={i} className="border-b border-wa-accent/15 px-3 py-2">
                                                        枠{i + 1}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hourBlocks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={1 + lanes} className="border-b border-wa-accent/10 px-3 py-4 text-wa-muted">
                                                        本日の枠がありません
                                                    </td>
                                                </tr>
                                            ) : (
                                                hourBlocks.map((b) => (
                                                    <tr key={b.time} className="transition-colors hover:bg-wa-card/20">
                                                        <td className="border-b border-wa-accent/10 px-3 py-3 font-medium text-wa-body">
                                                            {b.time}
                                                        </td>
                                                        {Array.from({ length: lanes }, (_, i) => i + 1).map((lane) => {
                                                            const val = effectiveUserId(b.rowIdx, lane);
                                                            return (
                                                                <td key={lane} className="border-b border-wa-accent/10 px-3 py-2">
                                                                    {isAdmin ? (
                                                                        <select
                                                                            className="nordic-field w-full py-2 pl-3 pr-8 text-xs font-medium"
                                                                            value={String(val)}
                                                                            onChange={(e) => applyLaneSelection(b.rowIdx, lane, Number(e.target.value))}
                                                                        >
                                                                            <option value="0">未設定</option>
                                                                            {(users?.data ?? []).map((u) => {
                                                                                const already = selectedUserIds.has(u.id) && u.id !== val;
                                                                                return (
                                                                                    <option key={u.id} value={u.id} disabled={already}>
                                                                                        {u.name}
                                                                                    </option>
                                                                                );
                                                                            })}
                                                                        </select>
                                                                    ) : (
                                                                        <span className="inline-flex w-full justify-center rounded-full border border-wa-accent/18 bg-wa-card px-3 py-1 text-xs font-semibold text-wa-muted">
                                                                            {val > 0 ? (users?.data ?? []).find((u) => u.id === val)?.name ?? '—' : '—'}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                            </div>

                            {isAdmin ? (
                                <div className="mt-4 flex items-center justify-end">
                                    <PrimaryButton onClick={onSave} disabled={saving}>
                                        {saving ? '保存中…' : '保存'}
                                    </PrimaryButton>
                                </div>
                            ) : null}
                        </div>
                    </div>

                </NordicCard>
            </div>
        </AuthenticatedLayout>
    );
}
