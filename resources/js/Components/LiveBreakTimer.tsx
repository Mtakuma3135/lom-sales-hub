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
        if (!serverNowISO) return new Date(tickMs);
        const server = new Date(serverNowISO).getTime();
        if (Number.isNaN(server)) return new Date(tickMs);
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
                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">LIVE</div>
                <div className="wa-nums font-mono text-xs font-semibold text-wa-muted">
                    {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                </div>
            </div>

            <div className="mt-3 rounded-sm border border-wa-accent/20 bg-wa-card p-4">
                <div className="relative h-14 overflow-hidden rounded-sm bg-wa-ink ring-1 ring-wa-accent/15">
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
                                className="absolute top-2 bottom-2 rounded-sm bg-wa-subtle/90 ring-1 ring-wa-accent/20 transition hover:bg-wa-subtle hover:ring-wa-accent/40"
                                style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
                                aria-label={`時間帯 ${s.start_time}〜${s.end_time}`}
                            />
                        );
                    })}

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

                            const top = 9 + idx * 10;
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
                                                ? 'bg-gradient-to-r from-teal-500 via-teal-400 to-amber-400 shadow-[0_0_14px_rgba(20,184,166,0.35)]'
                                                : 'bg-teal-500 shadow-[0_0_14px_rgba(20,184,166,0.35)]')
                                        }
                                        style={{ left: `${left}%`, width: `${Math.max(0, head - left)}%` }}
                                    />

                                    <motion.div
                                        layoutId={`break-avatar-${row.user.id}`}
                                        className="absolute -top-2 h-6 w-6 rounded-full border border-wa-accent/25 bg-wa-card text-[10px] font-semibold text-wa-body ring-1 ring-wa-accent/20"
                                        style={{ left: `calc(${head}% - 12px)` }}
                                        title={row.user.name}
                                    >
                                        <div className="grid h-full w-full place-items-center">{initials(row.user.name)}</div>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1 bottom-1 w-[2px] bg-teal-400/70 shadow-[0_0_18px_rgba(45,212,191,0.35)]"
                        style={{ left: `calc(${sweepLeft}% - 1px)` }}
                    />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-wa-muted">
                    <div>
                        時間帯: <span className="font-semibold text-wa-body">{plannedSlots.length}</span>
                    </div>
                    <div>
                        実際に休憩中: <span className="font-semibold text-wa-body">{activeRows.length}名</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
