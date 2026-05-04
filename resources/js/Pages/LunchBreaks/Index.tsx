import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import NordicCard from '@/Components/UI/NordicCard';
import ActionButton from '@/Components/ActionButton';
import DetailDrawer from '@/Components/DetailDrawer';
import LiveBreakTimer, { ActiveBreakRow } from '@/Components/LiveBreakTimer';
import ActiveStatusPanel from '@/Components/ActiveStatusPanel';

type ReservationUser = {
    id: number | null;
    name: string | null;
    role?: 'admin' | 'general' | string | null;
};

type Reservation = {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    user: ReservationUser;
};

type Slot = {
    start_time: string;
    end_time: string;
    capacity: number;
    reservations: Reservation[];
};

type SlotsProp = {
    data: Slot[];
    meta?: { date?: string };
};

type UserOption = {
    id: number;
    name: string;
    employee_code: string | null;
    role: string;
};

type UsersProp = {
    data: UserOption[];
};

type MyAssignment = {
    start_time: string;
    end_time: string;
} | null;

export default function Index({
    slots,
    users,
    myAssignment,
}: {
    slots?: SlotsProp;
    users?: UsersProp;
    myAssignment?: MyAssignment;
}) {
    const { props } = usePage<PageProps>();
    const actorId = props.auth?.user?.id ?? null;
    const isAdmin = props.auth?.user?.role === 'admin';

    const date = slots?.meta?.date ?? new Date().toISOString().slice(0, 10);

    const { setData, post, processing } = useForm({
        date,
        start_time: '',
        user_ids: [] as number[],
    });

    const [assignState, setAssignState] = useState<Record<string, number[]>>({});

    const onAssignSave = (startTime: string) => {
        const ids = assignState[startTime] ?? [];
        const clean = Array.from(new Set(ids.filter((x) => Number.isFinite(x) && x > 0)));
        setData('date', date);
        setData('start_time', startTime);
        setData('user_ids', clean);
        post(route('lunch-breaks.assign'), {
            preserveScroll: true,
        });
    };

    const slotRows: Slot[] =
        slots?.data ??
        [
            {
                start_time: '12:00',
                end_time: '13:00',
                capacity: 3,
                reservations: [
                    {
                        id: 1,
                        date,
                        start_time: '12:00:00',
                        end_time: '13:00:00',
                        user: { id: 1, name: '山田太郎', role: 'general' },
                    },
                ],
            },
            {
                start_time: '13:00',
                end_time: '14:00',
                capacity: 3,
                reservations: [
                    {
                        id: 2,
                        date,
                        start_time: '13:00:00',
                        end_time: '14:00:00',
                        user: { id: 2, name: '佐藤花子', role: 'general' },
                    },
                ],
            },
        ];

    /**
     * 管理者は「自分の枠」が存在しないため、タイマー演出のプレビュー用に
     * クリックしたスロットをタイマー対象として扱う。
     */
    const [adminTimerSlot, setAdminTimerSlot] = useState<{ start_time: string; end_time: string } | null>(null);
    const activeAssignment = (isAdmin ? adminTimerSlot : myAssignment) as MyAssignment;

    // --- 1時間タイマー（localStorage永続） ---
    const timerKey = useMemo(() => {
        const st = activeAssignment?.start_time ?? 'none';
        return `lunchBreakTimer:${date}:${st}:${actorId ?? 'guest'}`;
    }, [date, activeAssignment?.start_time, actorId]);

    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [notified, setNotified] = useState<boolean>(false);

    useEffect(() => {
        setStartedAt(null);
        setNotified(false);
        if (!activeAssignment || !actorId) return;
        const raw = localStorage.getItem(timerKey);
        if (raw) {
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) setStartedAt(parsed);
        }
    }, [timerKey, activeAssignment, actorId]);

    useEffect(() => {
        if (!startedAt) return;
        const t = window.setInterval(() => setNowMs(Date.now()), 250);
        return () => window.clearInterval(t);
    }, [startedAt]);

    const totalMs = 60 * 60 * 1000;
    const elapsedMs = startedAt ? Math.max(0, nowMs - startedAt) : 0;
    const remainingMs = startedAt ? Math.max(0, totalMs - elapsedMs) : totalMs;
    const isWarning = startedAt ? remainingMs <= 5 * 60 * 1000 && remainingMs > 0 : false;

    const formatMMSS = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    useEffect(() => {
        if (!startedAt || notified) return;
        if (remainingMs > 0) return;

        setNotified(true);

        fetch(route('lunch-breaks.complete'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ date }),
        }).catch(() => {
            // 失敗時はサーバー側でログ。UIは止めない。
        });
    }, [startedAt, remainingMs, notified, date]);

    const startTimerFor = (startTime: string) => {
        const t = Date.now();
        const key = `lunchBreakTimer:${date}:${startTime}:${actorId ?? 'guest'}`;
        localStorage.setItem(key, String(t));
        setStartedAt(t);
        setNotified(false);
    };

    const progressPct = startedAt ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;

    // --- Monitoring: ActiveStatusPanel / LiveBreakTimer ---
    const plannedWindow = useMemo(() => {
        const first = slotRows[0];
        const last = slotRows[slotRows.length - 1];
        return {
            start: first?.start_time ?? '12:00',
            end: last?.end_time ?? '14:00',
        };
    }, [slotRows]);

    const [monitorActive, setMonitorActive] = useState<ActiveBreakRow[]>([]);
    const [monitorServerTime, setMonitorServerTime] = useState<string | null>(null);
    const [monitorLoading, setMonitorLoading] = useState<boolean>(false);

    const fetchMonitor = async () => {
        setMonitorLoading(true);
        try {
            const res = await fetch(route('portal.api.lunch-breaks.status', { date }), {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const json = await res.json();
            const rows = (json?.data?.active ?? []) as ActiveBreakRow[];
            setMonitorActive(Array.isArray(rows) ? rows : []);
            setMonitorServerTime((json?.meta?.server_time ?? null) as string | null);
        } catch {
            // 監視は失敗しても画面の基本操作を阻害しない
        } finally {
            setMonitorLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitor();
        const t = window.setInterval(fetchMonitor, 60_000);
        return () => window.clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    // --- Quick action drawer ("今から休憩") ---
    const [quickOpen, setQuickOpen] = useState<boolean>(false);
    const [quickSlotStart, setQuickSlotStart] = useState<string>('12:00');
    const [quickReason, setQuickReason] = useState<string>('on_time');
    const [quickNote, setQuickNote] = useState<string>('');
    const [quickUserId, setQuickUserId] = useState<number>(actorId ?? 0);
    const [quickSubmitting, setQuickSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (!isAdmin && actorId) setQuickUserId(actorId);
    }, [actorId, isAdmin]);

    const openQuick = (slotStartTime: string) => {
        setQuickSlotStart(slotStartTime);
        setQuickReason('on_time');
        setQuickNote('');
        setQuickOpen(true);
    };

    const submitQuick = async () => {
        setQuickSubmitting(true);
        try {
            const res = await fetch(route('portal.api.lunch-breaks.start'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    date,
                    planned_start_time: quickSlotStart,
                    user_id: isAdmin ? quickUserId : undefined,
                    reason: quickReason,
                    note: quickNote || undefined,
                }),
            });

            if (!res.ok) return;

            setQuickOpen(false);
            await fetchMonitor();
        } finally {
            setQuickSubmitting(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-semibold tracking-tight text-stone-800">昼休憩</h2>}>
            <Head title="昼休憩管理" />
            <div className="mx-auto max-w-6xl px-2 py-2 text-stone-700 sm:px-0">
                <NordicCard elevate={false} className="px-8 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                                昼休憩 · 1時間スロット
                            </div>
                            <div className="mt-2 text-xl font-semibold tracking-tight text-stone-800">{date}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-full bg-stone-100 px-4 py-1.5 text-xs font-semibold text-stone-600 ring-1 ring-stone-200/80">
                                定員: {slotRows[0]?.capacity ?? 3}
                            </div>
                            <div className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                                {isAdmin ? '管理者: 割当' : '閲覧'}
                            </div>
                        </div>
                    </div>
                </NordicCard>

                <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-10">
                    <NordicCard elevate={false} className="p-8">
                        <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">ルール</div>
                        <div className="mt-2 text-sm font-semibold text-stone-800">予約条件</div>
                        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-stone-600">
                            <li>・1時間単位（HH:00）</li>
                            <li>・同一ユーザーは同日に重複割当不可</li>
                            <li>・管理者が割り当てを登録（一般は閲覧のみ）</li>
                        </ul>
                        <div className="mt-6 rounded-xl border border-stone-100 bg-stone-50 p-4 text-xs leading-relaxed text-stone-500">
                            タイマーはセージグリーンのバーで経過を表現します。残り5分を切るとアンバーに変わり、数字がゆっくり明滅します。
                        </div>
                    </NordicCard>

                    <NordicCard elevate={false} className="p-8 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">タイムライン</div>
                                <div className="mt-2 text-lg font-semibold tracking-tight text-stone-800">スロット一覧</div>
                            </div>
                            <div className="text-xs font-medium text-stone-500">{processing ? '同期中…' : '準備完了'}</div>
                        </div>

                        <div className="mt-7">
                            <LiveBreakTimer
                                timeWindow={plannedWindow}
                                plannedSlots={slotRows.map((s) => ({ start_time: s.start_time, end_time: s.end_time }))}
                                activeRows={monitorActive}
                                serverNowISO={monitorServerTime}
                                onOpenQuickAction={openQuick}
                            />
                            <div className="mt-2 text-right text-[11px] text-stone-500">
                                {monitorLoading ? '更新中…' : '1分ごとに自動更新'}
                            </div>
                        </div>

                        {/* 自分のタイマー */}
                        {activeAssignment ? (
                            <div className="mt-8 rounded-2xl border border-stone-100 bg-stone-50/80 p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                                        {isAdmin ? '選択中の枠（プレビュー）' : 'あなたの枠'}
                                        </div>
                                        <div className="mt-1 text-lg font-semibold text-stone-800">
                                            {activeAssignment.start_time} - {activeAssignment.end_time}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                                            残り時間
                                        </div>
                                        <div
                                            className={
                                                'mt-1 font-mono text-3xl font-semibold tracking-tight ' +
                                                (isWarning ? 'timer-breath text-red-600' : 'text-stone-800')
                                            }
                                        >
                                            {startedAt ? formatMMSS(remainingMs) : '60:00'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-stone-200">
                                    <div
                                        className={
                                            'h-full rounded-full transition-all duration-500 ease-out ' +
                                            (isWarning ? 'bg-red-500' : 'bg-emerald-500')
                                        }
                                        style={{
                                            width: `${startedAt ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0}%`,
                                        }}
                                    />
                                </div>
                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-xs text-stone-500">
                                        {startedAt ? '休憩の経過を表示しています' : '開始で1時間のカウントダウンが始まります'}
                                    </div>
                                    <ActionButton
                                        onClick={() => startTimerFor(activeAssignment.start_time)}
                                        disabled={!!startedAt && remainingMs > 0}
                                    >
                                        開始
                                    </ActionButton>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-8 space-y-4">
                            {slotRows.map((slot) => {
                                const remaining = Math.max(
                                    0,
                                    slot.capacity - (slot.reservations?.length ?? 0)
                                );

                                const isMySlot =
                                    !isAdmin &&
                                    !!myAssignment &&
                                    myAssignment.start_time === slot.start_time &&
                                    myAssignment.end_time === slot.end_time;

                                const canStartByClick = (isAdmin || isMySlot) && (!!actorId || isAdmin);

                                return (
                                    <NordicCard
                                        key={slot.start_time}
                                        elevate
                                        role={canStartByClick ? 'button' : undefined}
                                        tabIndex={canStartByClick ? 0 : undefined}
                                        onClick={() => {
                                            // 仕様: スロットを押したら開始（一般: 自分の枠 / 管理者: プレビュー）
                                            if (!canStartByClick) return;
                                            if (isAdmin) setAdminTimerSlot({ start_time: slot.start_time, end_time: slot.end_time });
                                            if (startedAt && remainingMs > 0) return;
                                            startTimerFor(slot.start_time);
                                        }}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                                            if (!canStartByClick) return;
                                            if (e.key !== 'Enter' && e.key !== ' ') return;
                                            e.preventDefault();
                                            if (isAdmin) setAdminTimerSlot({ start_time: slot.start_time, end_time: slot.end_time });
                                            if (startedAt && remainingMs > 0) return;
                                            startTimerFor(slot.start_time);
                                        }}
                                        className={
                                            'relative px-5 py-5 ' +
                                            (canStartByClick ? 'cursor-pointer ring-1 ring-emerald-100' : '')
                                        }
                                    >
                                        {/* 自分の枠: 外周を走る進捗フレーム */}
                                        {(isMySlot || (isAdmin && adminTimerSlot?.start_time === slot.start_time)) ? (
                                            <svg
                                                aria-hidden
                                                className="pointer-events-none absolute inset-0 h-full w-full"
                                                viewBox="0 0 100 100"
                                                preserveAspectRatio="none"
                                            >
                                                {/* ガイド（薄く） */}
                                                <rect
                                                    x="2"
                                                    y="2"
                                                    width="96"
                                                    height="96"
                                                    rx="18"
                                                    ry="18"
                                                    fill="none"
                                                    stroke="rgba(16,185,129,0.18)"
                                                    strokeWidth="2"
                                                />
                                                {/* 進捗（走る外周） */}
                                                <rect
                                                    x="2"
                                                    y="2"
                                                    width="96"
                                                    height="96"
                                                    rx="18"
                                                    ry="18"
                                                    fill="none"
                                                    pathLength={100}
                                                    stroke={isWarning ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)'}
                                                    strokeWidth="2.4"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${progressPct} 100`}
                                                    className="transition-[stroke-dasharray] duration-300 ease-out"
                                                />
                                                {/* 先頭の光点（走ってる感） */}
                                                <rect
                                                    x="2"
                                                    y="2"
                                                    width="96"
                                                    height="96"
                                                    rx="18"
                                                    ry="18"
                                                    fill="none"
                                                    pathLength={100}
                                                    stroke={isWarning ? 'rgba(239,68,68,1)' : 'rgba(16,185,129,1)'}
                                                    strokeWidth="4.2"
                                                    strokeLinecap="round"
                                                    strokeDasharray="0.8 99.2"
                                                    strokeDashoffset={100 - progressPct}
                                                    className={
                                                        isWarning
                                                            ? 'drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                            : 'drop-shadow-[0_0_10px_rgba(16,185,129,0.45)]'
                                                    }
                                                />
                                            </svg>
                                        ) : null}

                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                                                    <div>
                                                        <div className="text-sm font-semibold text-stone-800">
                                                            {slot.start_time} - {slot.end_time}
                                                        </div>
                                                        <div className="mt-1 text-xs text-stone-500">
                                                            空き {remaining}/{slot.capacity}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="hidden h-10 w-px bg-stone-200 sm:block" />

                                                <div className="flex flex-wrap gap-2">
                                                    {slot.reservations.length === 0 ? (
                                                        <span className="text-xs text-stone-400">予約なし</span>
                                                    ) : (
                                                        slot.reservations.map((r) => {
                                                            const isMine =
                                                                actorId !== null &&
                                                                r.user?.id !== null &&
                                                                r.user.id === actorId;
                                                            return (
                                                                <span
                                                                    key={r.id}
                                                                    className={
                                                                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ' +
                                                                        (isMine
                                                                            ? 'bg-emerald-50 text-emerald-900 ring-emerald-100'
                                                                            : 'bg-stone-100 text-stone-700 ring-stone-200/80')
                                                                    }
                                                                >
                                                                    {r.user?.name ?? '—'}
                                                                </span>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isAdmin ? (
                                                    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                                                        <div
                                                            className="grid w-full grid-cols-1 gap-2 sm:w-[360px] sm:grid-cols-3"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                        >
                                                            {Array.from({ length: slot.capacity }).map((_, idx) => {
                                                                const current =
                                                                    (assignState[slot.start_time] ??
                                                                        slot.reservations.map((r) => r.user?.id ?? 0))[idx] ?? 0;
                                                                return (
                                                                    <select
                                                                        key={idx}
                                                                        value={String(current ?? 0)}
                                                                        aria-label={`休憩者 ${idx + 1}`}
                                                                        onChange={(e) => {
                                                                            const next = Number(e.target.value);
                                                                            setAssignState((prev) => {
                                                                                const base =
                                                                                    prev[slot.start_time] ??
                                                                                    slot.reservations.map((r) => r.user?.id ?? 0);
                                                                                const arr = Array.from({ length: slot.capacity }).map((__, i) => Number(base[i] ?? 0));
                                                                                arr[idx] = Number.isFinite(next) ? next : 0;
                                                                                return { ...prev, [slot.start_time]: arr };
                                                                            });
                                                                        }}
                                                                        className="nordic-field py-2 text-xs font-semibold"
                                                                    >
                                                                        <option value="0">未設定</option>
                                                                        {(users?.data ?? []).map((u) => (
                                                                            <option key={u.id} value={u.id}>
                                                                                {u.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                );
                                                            })}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => onAssignSave(slot.start_time)}
                                                            disabled={
                                                                processing ||
                                                                ((assignState[slot.start_time] ?? slot.reservations.map((r) => r.user?.id ?? 0)).filter(
                                                                    (x) => Number.isFinite(x) && x > 0,
                                                                ).length ?? 0) === 0
                                                            }
                                                            onClickCapture={(e) => e.stopPropagation()}
                                                            className={
                                                                'rounded-xl px-4 py-2 text-xs font-semibold transition ' +
                                                                ((assignState[slot.start_time] ?? slot.reservations.map((r) => r.user?.id ?? 0)).filter(
                                                                    (x) => Number.isFinite(x) && x > 0,
                                                                ).length > 0
                                                                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/25 hover:from-emerald-500/95 hover:to-emerald-600/95'
                                                                    : 'cursor-not-allowed bg-stone-200 text-stone-400')
                                                            }
                                                        >
                                                            保存
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-stone-400">閲覧のみ</span>
                                                )}
                                            </div>
                                        </div>
                                    </NordicCard>
                                );
                            })}
                        </div>
                    </NordicCard>

                    <div className="lg:col-span-1">
                        <ActiveStatusPanel
                            activeRows={monitorActive}
                            windowStart={plannedWindow.start}
                            windowEnd={plannedWindow.end}
                        />
                    </div>
                </div>
            </div>

            <DetailDrawer open={quickOpen} onClose={() => setQuickOpen(false)} title="今から休憩（クイック）">
                <div className="space-y-5">
                    <div className="rounded-2xl border border-stone-200 bg-white/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">対象枠</div>
                        <div className="mt-2 text-lg font-semibold tracking-tight text-stone-800">
                            {quickSlotStart} -{' '}
                            {(slotRows.find((s) => s.start_time === quickSlotStart)?.end_time ?? '—')}
                        </div>
                        <div className="mt-2 text-xs text-stone-500">
                            予定とズレても「今から休憩」で実稼働として記録します。予定超過は自動で Amber 表示になります。
                        </div>
                    </div>

                    {isAdmin ? (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">休憩者</div>
                            <select
                                value={String(quickUserId || 0)}
                                onChange={(e) => setQuickUserId(Number(e.target.value))}
                                className="nordic-field mt-2 w-full py-2 text-sm font-semibold"
                            >
                                <option value="0">選択してください</option>
                                {(users?.data ?? []).map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">理由</div>
                        <select
                            value={quickReason}
                            onChange={(e) => setQuickReason(e.target.value)}
                            className="nordic-field mt-2 w-full py-2 text-sm font-semibold"
                        >
                            <option value="on_time">予定通り</option>
                            <option value="delay_30">仕事都合で30分後ろ倒し</option>
                            <option value="delay_60">仕事都合で60分後ろ倒し</option>
                            <option value="call">電話対応</option>
                            <option value="customer">来客対応</option>
                            <option value="meeting">ミーティング</option>
                            <option value="other">その他</option>
                        </select>
                        <textarea
                            value={quickNote}
                            onChange={(e) => setQuickNote(e.target.value)}
                            placeholder="補足（任意）"
                            className="nordic-field mt-2 min-h-[84px] w-full resize-y px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setQuickOpen(false)}
                            className="rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-100/80"
                        >
                            閉じる
                        </button>
                        <ActionButton
                            onClick={submitQuick}
                            disabled={quickSubmitting || (isAdmin && (!quickUserId || quickUserId <= 0))}
                        >
                            今から休憩
                        </ActionButton>
                    </div>
                </div>
            </DetailDrawer>
        </AuthenticatedLayout>
    );
}

