import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useMemo, useState } from 'react';

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
        setData('date', date);
        setData('start_time', startTime);
        setData('user_ids', ids);
        post(route('lunch-breaks.assign'), {
            preserveScroll: true,
        });
    };

    const slotRows: Slot[] =
        slots?.data ??
        [
            {
                start_time: '12:00',
                end_time: '12:30',
                capacity: 3,
                reservations: [
                    {
                        id: 1,
                        date,
                        start_time: '12:00:00',
                        end_time: '12:30:00',
                        user: { id: 1, name: '山田太郎', role: 'general' },
                    },
                ],
            },
            {
                start_time: '12:30',
                end_time: '13:00',
                capacity: 3,
                reservations: [
                    {
                        id: 2,
                        date,
                        start_time: '12:30:00',
                        end_time: '13:00:00',
                        user: { id: 2, name: '佐藤花子', role: 'general' },
                    },
                ],
            },
            { start_time: '13:00', end_time: '13:30', capacity: 3, reservations: [] },
            { start_time: '13:30', end_time: '14:00', capacity: 3, reservations: [] },
        ];

    // --- 1時間タイマー（localStorage永続） ---
    const timerKey = useMemo(() => {
        const st = myAssignment?.start_time ?? 'none';
        return `lunchBreakTimer:${date}:${st}:${actorId ?? 'guest'}`;
    }, [date, myAssignment?.start_time, actorId]);

    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [notified, setNotified] = useState<boolean>(false);

    useEffect(() => {
        if (!myAssignment || !actorId) return;
        const raw = localStorage.getItem(timerKey);
        if (raw) {
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) setStartedAt(parsed);
        }
    }, [timerKey, myAssignment, actorId]);

    useEffect(() => {
        if (!startedAt) return;
        const t = window.setInterval(() => setNowMs(Date.now()), 250);
        return () => window.clearInterval(t);
    }, [startedAt]);

    const totalMs = 60 * 60 * 1000;
    const elapsedMs = startedAt ? Math.max(0, nowMs - startedAt) : 0;
    const remainingMs = startedAt ? Math.max(0, totalMs - elapsedMs) : totalMs;
    const progress = startedAt ? Math.max(0, Math.min(1, 1 - elapsedMs / totalMs)) : 1;
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

    const onStartTimer = () => {
        const t = Date.now();
        localStorage.setItem(timerKey, String(t));
        setStartedAt(t);
        setNotified(false);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">LUNCH / TIMELINE</h2>}>
            <Head title="昼休憩管理" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                    <div className="pointer-events-none absolute -inset-24 bg-gradient-to-br from-purple-500/25 to-cyan-400/15 blur-3xl" />
                    <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-white/60">
                                RESERVATION / 30MIN SLOTS
                            </div>
                            <div className="mt-1 text-lg font-black tracking-tight text-white">
                                {date}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-white/70 ring-1 ring-inset ring-white/10">
                                CAP: {slotRows[0]?.capacity ?? 3}
                            </div>
                            <div className="rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-400/15 px-3 py-1 text-xs font-black text-white ring-1 ring-inset ring-white/10 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
                                MODE: {isAdmin ? 'ADMIN ASSIGN' : 'VIEW'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* 左：ルール */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">
                            RULES
                        </div>
                        <div className="mt-2 text-sm font-black tracking-tight text-white">
                            予約条件
                        </div>
                        <ul className="mt-4 space-y-2 text-sm text-white/70">
                            <li>・30分単位（HH:00 / HH:30）</li>
                            <li>・同一ユーザーは同日に重複割当不可</li>
                            <li>・管理者が割り当てを登録（一般は閲覧のみ）</li>
                        </ul>
                        <div className="mt-5 rounded-xl border border-white/10 bg-[#0b1020]/60 p-4 text-xs text-white/60">
                            スロットをクリックするとネオンの枠が走る演出にしています（hover/active）。
                        </div>
                    </div>

                    {/* 右：タイムライン */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">
                                    TIMELINE
                                </div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">
                                    スロット一覧
                                </div>
                            </div>
                            <div className="text-xs font-semibold text-cyan-200/80">
                                {processing ? 'SYNC…' : 'READY'}
                            </div>
                        </div>

                        {/* 自分のタイマー */}
                        {!isAdmin && myAssignment ? (
                            <div className="mt-5">
                                <div
                                    className={
                                        'relative overflow-hidden rounded-2xl p-[2px] ' +
                                        (isWarning ? 'animate-pulse' : '')
                                    }
                                    style={{
                                        background: `conic-gradient(from 270deg, ${
                                            isWarning ? '#fb7185' : '#22d3ee'
                                        } ${Math.round(progress * 360)}deg, rgba(255,255,255,0.08) 0deg)`,
                                    }}
                                >
                                    <div className="rounded-2xl border border-white/10 bg-[#0b1020]/60 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-xs font-bold tracking-widest text-white/60">
                                                    YOUR SLOT
                                                </div>
                                                <div className="mt-1 text-lg font-black tracking-tight text-white">
                                                    {myAssignment.start_time} - {myAssignment.end_time}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[11px] font-bold tracking-widest text-white/55">
                                                    COUNTDOWN
                                                </div>
                                                <div className="mt-1 font-mono text-2xl font-black tracking-tight text-white">
                                                    {startedAt ? formatMMSS(remainingMs) : '60:00'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-xs text-white/50">
                                                {startedAt ? 'タイマー稼働中' : '開始ボタンでタイマー開始'}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={onStartTimer}
                                                disabled={!!startedAt && remainingMs > 0}
                                                className={
                                                    'rounded-2xl px-4 py-2 text-xs font-black tracking-tight transition ' +
                                                    (!startedAt || remainingMs === 0
                                                        ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.25)] hover:brightness-110'
                                                        : 'bg-white/5 text-white/35 ring-1 ring-inset ring-white/10')
                                                }
                                            >
                                                START
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-5 space-y-3">
                            {slotRows.map((slot) => {
                                const remaining = Math.max(
                                    0,
                                    slot.capacity - (slot.reservations?.length ?? 0)
                                );

                                return (
                                    <div
                                        key={slot.start_time}
                                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/50 px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_26px_rgba(168,85,247,0.18)]"
                                    >
                                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-400/10" />

                                        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                                                    <div>
                                                        <div className="text-sm font-black tracking-tight text-white">
                                                            {slot.start_time} - {slot.end_time}
                                                        </div>
                                                        <div className="mt-1 text-xs text-white/55">
                                                            remaining {remaining}/{slot.capacity}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="hidden h-10 w-px bg-white/10 sm:block" />

                                                <div className="flex flex-wrap gap-2">
                                                    {slot.reservations.length === 0 ? (
                                                        <span className="text-xs text-white/40">
                                                            no reservations
                                                        </span>
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
                                                                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ' +
                                                                        (isMine
                                                                            ? 'bg-gradient-to-r from-purple-500/25 to-cyan-400/20 text-white ring-1 ring-inset ring-white/10 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                                                                            : 'bg-white/5 text-white/75 ring-1 ring-inset ring-white/10')
                                                                    }
                                                                >
                                                                    {r.user?.name ?? '—'}
                                                                </span>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                            <div className="relative flex items-center gap-2">
                                                {isAdmin ? (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <select
                                                            multiple
                                                            value={(assignState[slot.start_time] ?? []).map(String)}
                                                            onChange={(e) => {
                                                                const vals = Array.from(e.target.selectedOptions).map((o) =>
                                                                    Number(o.value),
                                                                );
                                                                setAssignState((prev) => ({
                                                                    ...prev,
                                                                    [slot.start_time]: vals,
                                                                }));
                                                            }}
                                                            className="h-24 w-64 rounded-2xl border border-white/10 bg-[#0b1020]/60 px-3 py-2 text-xs font-black tracking-tight text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                                                        >
                                                            {(users?.data ?? []).map((u) => (
                                                                <option key={u.id} value={u.id}>
                                                                    {u.name}（{u.employee_code ?? '-'}）
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => onAssignSave(slot.start_time)}
                                                            disabled={processing || (assignState[slot.start_time]?.length ?? 0) === 0}
                                                            className={
                                                                'rounded-2xl px-4 py-2 text-xs font-black tracking-tight transition ' +
                                                                ((assignState[slot.start_time]?.length ?? 0) > 0
                                                                    ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.25)] hover:brightness-110'
                                                                    : 'bg-white/5 text-white/35 ring-1 ring-inset ring-white/10')
                                                            }
                                                        >
                                                            SAVE
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-white/35">read only</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

