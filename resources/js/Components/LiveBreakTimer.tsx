import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type PlannedWindow = {
    start: string; // "HH:MM"
    end: string; // "HH:MM"
};

export type ActiveBreakRow = {
    date: string;
    user: { id: number; name: string };
    planned: { start_time: string; end_time: string };
    active: { started_at: string };
    reason: string;
    note?: string | null;
    updated_by: number;
};

function hhmmToMinutes(v: string): number {
    const [hh, mm] = v.split(':').map((x) => Number(x));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
    return hh * 60 + mm;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function pctBetween(v: number, a: number, b: number): number {
    if (b <= a) return 0;
    return ((v - a) / (b - a)) * 100;
}

function initials(name: string): string {
    const s = (name ?? '').trim();
    if (!s) return '—';
    return s.slice(0, 2);
}

export default function LiveBreakTimer({
    timeWindow,
    plannedSlots,
    activeRows,
    serverNowISO,
    onOpenQuickAction,
}: {
    timeWindow: PlannedWindow;
    plannedSlots: Array<{ start_time: string; end_time: string }>;
    activeRows: ActiveBreakRow[];
    serverNowISO?: string | null;
    onOpenQuickAction: (slotStartTime: string) => void;
}) {
    const windowStartMin = useMemo(() => hhmmToMinutes(timeWindow.start), [timeWindow.start]);
    const windowEndMin = useMemo(() => hhmmToMinutes(timeWindow.end), [timeWindow.end]);

    const [tickMs, setTickMs] = useState<number>(() => Date.now());
    useEffect(() => {
        const t = window.setInterval(() => setTickMs(Date.now()), 1000);
        return () => window.clearInterval(t);
    }, []);

    const now = useMemo(() => {
        // サーバー時刻が来ていればそれを基準にする（フロント時計ズレを減らす）
        if (!serverNowISO) return new Date(tickMs);
        const server = new Date(serverNowISO).getTime();
        if (Number.isNaN(server)) return new Date(tickMs);
        // 取得時点の server_time を now として使う（ポーリング間はローカル tick で進める）
        const drift = tickMs - Date.now();
        return new Date(server + drift);
    }, [serverNowISO, tickMs]);

    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const sweepLeft = clamp(pctBetween(nowMin, windowStartMin, windowEndMin), 0, 100);

    const sortedActive = useMemo(() => {
        return [...activeRows].sort((a, b) => (a.user.id ?? 0) - (b.user.id ?? 0));
    }, [activeRows]);

    return (
        <div className="relative">
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">LIVE</div>
                <div className="font-mono text-xs font-semibold text-stone-500">
                    {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                </div>
            </div>

            <div className="mt-3 rounded-2xl border border-stone-200/70 bg-stone-100/70 p-4 ring-1 ring-white/60">
                <div className="relative h-14 overflow-hidden rounded-xl bg-white/65 ring-1 ring-stone-200">
                    {/* planned slots (Stone-100) */}
                    {plannedSlots.map((s) => {
                        const a = hhmmToMinutes(s.start_time);
                        const b = hhmmToMinutes(s.end_time);
                        const left = clamp(pctBetween(a, windowStartMin, windowEndMin), 0, 100);
                        const right = clamp(pctBetween(b, windowStartMin, windowEndMin), 0, 100);
                        return (
                            <button
                                key={s.start_time}
                                type="button"
                                onClick={() => onOpenQuickAction(s.start_time)}
                                className="absolute top-2 bottom-2 rounded-lg bg-stone-100/95 ring-1 ring-stone-200/80 transition hover:bg-stone-100 hover:ring-emerald-200"
                                style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
                                aria-label={`予定枠 ${s.start_time}-${s.end_time}`}
                            />
                        );
                    })}

                    {/* active rows */}
                    <AnimatePresence initial={false}>
                        {sortedActive.map((row, idx) => {
                            const started = new Date(row.active.started_at).getTime();
                            const startedAt = Number.isNaN(started) ? now.getTime() : started;
                            const startedDate = new Date(startedAt);
                            const startedMin =
                                startedDate.getHours() * 60 + startedDate.getMinutes() + startedDate.getSeconds() / 60;
                            const left = clamp(pctBetween(startedMin, windowStartMin, windowEndMin), 0, 100);
                            const head = clamp(sweepLeft, left, 100);

                            const plannedEndMin = hhmmToMinutes(row.planned.end_time);
                            const overtime = nowMin > plannedEndMin + 0.5;

                            const top = 9 + idx * 10; // stack
                            return (
                                <motion.div
                                    key={row.user.id}
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                    transition={{ duration: 0.22 }}
                                    className="absolute left-0 right-0"
                                    style={{ top }}
                                >
                                    <div
                                        className={
                                            'absolute h-2 rounded-full ' +
                                            (overtime
                                                ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                                                : 'bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.35)]')
                                        }
                                        style={{ left: `${left}%`, width: `${Math.max(0, head - left)}%` }}
                                    />

                                    <motion.div
                                        layoutId={`break-avatar-${row.user.id}`}
                                        className="absolute -top-2 h-6 w-6 rounded-full bg-white text-[10px] font-black text-stone-900 ring-1 ring-stone-200 shadow-sm"
                                        style={{ left: `calc(${head}% - 12px)` }}
                                        title={row.user.name}
                                    >
                                        <div className="grid h-full w-full place-items-center">
                                            {initials(row.user.name)}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* sweep line */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1 bottom-1 w-[2px] bg-emerald-600/60 shadow-[0_0_18px_rgba(16,185,129,0.25)]"
                        style={{ left: `calc(${sweepLeft}% - 1px)` }}
                    />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <div>
                        予定: <span className="font-semibold text-stone-700">{plannedSlots.length}枠</span>
                    </div>
                    <div>
                        実稼働: <span className="font-semibold text-stone-700">{activeRows.length}名</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

