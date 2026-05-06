import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import NordicCard from '@/Components/UI/NordicCard';
import BreakRunner from '@/Components/BreakRunner';

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
        duration_minutes?: number;
    };
    next?: { user: { id: number; name: string } | null };
};

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
    const lanes = timetable?.lanes ?? 3;

    const [selections, setSelections] = useState<Record<string, number>>({});
    const [tick, setTick] = useState(() => Date.now());
    const [activeRows, setActiveRows] = useState<ActiveRow[]>([]);

    /** 1休憩＝60分＝連続2行。前半の選択を後半に伝播（サーバー値の正規化含む） */
    useEffect(() => {
        const next: Record<string, number> = {};
        rows.forEach((row) => {
            row.cells.forEach((c) => {
                next[cellKey(row.time, c.lane)] = c.user?.id ?? 0;
            });
        });
        for (let lane = 1; lane <= lanes; lane++) {
            for (let i = 0; i < rows.length - 1; i++) {
                const u = next[cellKey(rows[i].time, lane)] ?? 0;
                if (u > 0) {
                    next[cellKey(rows[i + 1].time, lane)] = u;
                }
            }
        }
        setSelections(next);
    }, [rows, lanes]);

    useEffect(() => {
        const t = window.setInterval(() => setTick(Date.now()), 1000);
        return () => window.clearInterval(t);
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            const url = `${route('portal.api.lunch-breaks.status')}?date=${encodeURIComponent(date)}`;
            const res = await fetch(url, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const json = (await res.json()) as { data?: { active?: ActiveRow[] } };
            setActiveRows(Array.isArray(json.data?.active) ? json.data!.active! : []);
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
            if (newVal > 0 && rowIdx + 1 < rows.length) {
                next[cellKey(rows[rowIdx + 1].time, lane)] = newVal;
            }
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
                onFinish: () => setSaving(false),
            },
        );
    };

    const nowDate = useMemo(() => new Date(tick), [tick]);
    const blockStart = currentBlockStart(nowDate);
    const alertSeconds = 12;
    const rowIsAlert = (rowTime: string) =>
        rowTime === blockStart && nowDate.getSeconds() < alertSeconds;

    const laneLabels = ['休憩枠 1', '休憩枠 2', '休憩枠 3'];
    const laneAccent: Record<number, 'emerald' | 'sky' | 'amber'> = { 1: 'emerald', 2: 'sky', 3: 'amber' };

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
    };

    const stopLane = async (lane: number) => {
        await postJson(route('portal.api.lunch-breaks.stop'), { date, lane });
        void fetchStatus();
    };

    const resetLane = async (lane: number) => {
        await postJson(route('portal.api.lunch-breaks.reset'), { date, lane });
        void fetchStatus();
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
    const timerKey = useMemo(() => {
        const st = myAssignment?.start_time ?? 'none';
        return `lunchBreakTimer:${date}:${st}:${actorId ?? 'guest'}`;
    }, [date, myAssignment?.start_time, actorId]);

    const [startedAt, setStartedAt] = useState<number | null>(null);
    useEffect(() => {
        if (!myAssignment || !actorId) {
            setStartedAt(null);
            return;
        }
        const raw = localStorage.getItem(timerKey);
        if (raw) {
            const n = Number(raw);
            if (Number.isFinite(n)) setStartedAt(n);
        } else setStartedAt(null);
    }, [timerKey, myAssignment, actorId]);

    const elapsedMs = startedAt ? Math.max(0, tick - startedAt) : 0;
    const remainingMs = startedAt ? Math.max(0, totalMs - elapsedMs) : totalMs;
    const timerActive = !!(startedAt && remainingMs > 0 && remainingMs < totalMs);

    const startTimer = () => {
        if (!myAssignment || !actorId) return;
        const t0 = Date.now();
        localStorage.setItem(timerKey, String(t0));
        setStartedAt(t0);
    };

    const completeBreak = () => {
        fetch(route('lunch-breaks.complete'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            },
            body: JSON.stringify({ date }),
        }).catch(() => {});
        localStorage.removeItem(timerKey);
        setStartedAt(null);
    };

    useEffect(() => {
        if (!startedAt || remainingMs > 0) return;
        completeBreak();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startedAt, remainingMs]);

    return (
        <AuthenticatedLayout header={<h2 className="wa-body-track text-sm font-semibold text-wa-body">昼休憩</h2>}>
            <Head title="昼休憩タイムテーブル" />

            <div className="mx-auto max-w-5xl text-wa-body wa-body-track">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">昼休憩</div>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-wa-body">{date}</h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-wa-muted">
                            <span className="font-medium text-wa-body">1人あたりの休憩は60分</span>
                            です。開始は30分刻み（:00 / :30）から選べます。同じ休憩枠では、前半に人が入ると後半は自動的に同じ人になり、別の人は選べません。
                        </p>
                    </div>
                    {serverNow ? (
                        <div className="text-xs font-medium text-wa-muted">
                            サーバー: {new Date(serverNow).toLocaleString('ja-JP')}
                        </div>
                    ) : null}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[1, 2, 3].slice(0, lanes).map((lane) => {
                                const row = activeRows.find((r) => r.lane === lane) ?? null;
                                const remaining = row ? remainingFor(row) : null;
                                const active = remaining !== null && remaining > 0;
                                const currentName = row?.current?.user?.name ?? '—';
                                const nextName = row?.next?.user?.name ?? '—';
                                return (
                                    <NordicCard key={lane} elevate={false} className="p-4">
                                        <BreakRunner
                                            active={active}
                                            remainingMs={remaining ?? totalMs}
                                            totalMs={totalMs}
                                            accent={laneAccent[lane]}
                                            label={`枠${lane}: ${currentName}（次: ${nextName}）`}
                                        />
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => startLane(lane)}
                                                disabled={!isAdmin}
                                                className="rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-2 text-xs font-semibold text-wa-body transition hover:border-wa-accent/40 disabled:opacity-40"
                                            >
                                                スタート
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => stopLane(lane)}
                                                disabled={!isAdmin}
                                                className="rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-2 text-xs font-semibold text-wa-body transition hover:border-wa-accent/40 disabled:opacity-40"
                                            >
                                                ストップ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => resetLane(lane)}
                                                disabled={!isAdmin}
                                                className="rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-2 text-xs font-semibold text-wa-body transition hover:border-wa-accent/40 disabled:opacity-40"
                                            >
                                                リセット
                                            </button>
                                        </div>
                                    </NordicCard>
                                );
                            })}
                        </div>
                        {myAssignment && actorId ? (
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={startTimer}
                                    disabled={!!startedAt}
                                    className="rounded-sm border border-wa-accent/45 bg-wa-accent px-4 py-2 text-xs font-semibold text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-40"
                                >
                                    タイマー開始
                                </button>
                            </div>
                        ) : null}
                    </div>
                    {isAdmin ? (
                        <NordicCard elevate={false} className="p-5">
                            <div className="text-sm font-semibold text-wa-body">管理者</div>
                            <p className="mt-2 text-xs leading-relaxed text-wa-muted">
                                保存すると割付が更新され、GAS 連携が有効な場合はスプレッドシートにも同期されます。
                            </p>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={onSave}
                                className="mt-4 w-full rounded-sm border border-wa-accent/45 bg-wa-accent px-3 py-2.5 text-sm font-semibold text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-50"
                            >
                                {saving ? '保存中…' : 'タイムテーブルを保存'}
                            </button>
                        </NordicCard>
                    ) : null}
                </div>

                <div className="mt-8 overflow-x-auto rounded-sm border border-wa-accent/20 bg-wa-card">
                    <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                        <thead>
                            <tr className="text-xs font-semibold uppercase tracking-wider text-wa-muted">
                                <th
                                    className="sticky top-0 z-10 border-b border-wa-accent/20 bg-wa-ink/98 px-3 py-3 backdrop-blur-sm sm:px-4"
                                    scope="col"
                                >
                                    時
                                </th>
                                <th
                                    className="sticky top-0 z-10 border-b border-wa-accent/20 bg-wa-ink/98 px-2 py-3 backdrop-blur-sm"
                                    scope="col"
                                >
                                    30分
                                </th>
                                {laneLabels.slice(0, lanes).map((lb) => (
                                    <th
                                        key={lb}
                                        className="sticky top-0 z-10 border-b border-wa-accent/20 bg-wa-ink/98 px-2 py-3 backdrop-blur-sm sm:px-3"
                                        scope="col"
                                    >
                                        {lb}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {hourPairs.map((pair, pairIdx) => (
                                <Fragment key={pair.hourLabel}>
                                    {pair.segments.map((seg, segJ) => {
                                        const rowIdx = seg.idx;
                                        const alert = rowIsAlert(seg.row.time);
                                        const pairTint = pairIdx % 2 === 0 ? 'bg-wa-card' : 'bg-wa-ink';

                                        return (
                                            <tr
                                                key={seg.row.time}
                                                className={`border-b border-wa-accent/15 ${pairTint} transition-colors hover:bg-wa-ink/80`}
                                            >
                                                {segJ === 0 ? (
                                                    <th
                                                        rowSpan={pair.segments.length}
                                                        scope="rowgroup"
                                                        className="align-top border-r border-wa-accent/15 bg-wa-ink px-3 py-3 text-left sm:px-4"
                                                    >
                                                        <div className="text-xl font-bold tabular-nums tracking-tight text-wa-body">
                                                            {pair.hourLabel}
                                                        </div>
                                                        <div className="mt-1 text-[11px] font-medium leading-snug text-wa-muted">
                                                            60分＝下の2行
                                                        </div>
                                                    </th>
                                                ) : null}
                                                <td className="border-r border-wa-accent/15 px-2 py-2.5 text-xs tabular-nums text-wa-muted sm:px-3">
                                                    <span className="font-medium text-wa-body">
                                                        {seg.row.time}
                                                    </span>
                                                    <span className="text-wa-muted/70">〜</span>
                                                    {seg.row.end}
                                                </td>
                                                {seg.row.cells.map((c) => {
                                                    const val = effectiveUserId(rowIdx, c.lane);
                                                    const locked = isLockedTail(rowIdx, c.lane);
                                                    const burst = alert && val > 0;
                                                    const cannotStart =
                                                        isAdmin &&
                                                        !locked &&
                                                        !canStartHourBlock(rowIdx) &&
                                                        val === 0;

                                                    return (
                                                        <td
                                                            key={c.lane}
                                                            className={`px-2 py-2 align-middle sm:px-3 ${burst ? 'lunch-cell-alert rounded-lg' : ''}`}
                                                        >
                                                            {isAdmin ? (
                                                                <div className="space-y-1">
                                                                    <select
                                                                        className="nordic-field w-full py-2 pl-3 pr-8 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                                                                        value={String(val)}
                                                                        disabled={
                                                                            locked || cannotStart
                                                                        }
                                                                        title={
                                                                            locked
                                                                                ? 'この30分は直前の枠の続き（60分）のため変更できません'
                                                                                : cannotStart
                                                                                  ? 'この時間からは60分取れないため、ここでは開始できません'
                                                                                  : undefined
                                                                        }
                                                                        onChange={(e) =>
                                                                            applyLaneSelection(
                                                                                rowIdx,
                                                                                c.lane,
                                                                                Number(
                                                                                    e.target
                                                                                        .value,
                                                                                ),
                                                                            )
                                                                        }
                                                                        aria-label={`${seg.row.time} ${laneLabels[c.lane - 1]}`}
                                                                    >
                                                                        <option value="0">
                                                                            未設定
                                                                        </option>
                                                                        {(users?.data ?? []).map(
                                                                            (u) => (
                                                                                <option
                                                                                    key={u.id}
                                                                                    value={u.id}
                                                                                >
                                                                                    {u.name}
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </select>
                                                                    {locked ? (
                                                                        <div className="text-[10px] font-medium text-teal-400/90">
                                                                            60分休憩の後半
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex w-full justify-center rounded-sm border border-wa-accent/25 bg-wa-ink px-2.5 py-1.5 text-center text-xs font-semibold text-wa-body">
                                                                    {val > 0
                                                                        ? (users?.data ?? []).find(
                                                                              (u) => u.id === val,
                                                                          )?.name ??
                                                                          c.user?.name ??
                                                                          '—'
                                                                        : '—'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
