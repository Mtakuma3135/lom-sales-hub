import StatusBadge from '@/Components/StatusBadge';
import NordicCard from '@/Components/UI/NordicCard';
import { ActiveBreakRow } from '@/Components/LiveBreakTimer';

function hhmmToMinutes(v: string): number {
    const [hh, mm] = v.split(':').map((x) => Number(x));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
    return hh * 60 + mm;
}

export default function ActiveStatusPanel({
    activeRows,
    windowStart,
    windowEnd,
}: {
    activeRows: ActiveBreakRow[];
    windowStart: string;
    windowEnd: string;
}) {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const activeCount = activeRows.length;

    const upcomingCount = activeRows.filter((r) => {
        const startMin = hhmmToMinutes(r.planned.start_time);
        return startMin > nowMin && startMin <= nowMin + 60;
    }).length;

    return (
        <NordicCard elevate={false} className="p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">状況</div>
                    <div className="mt-1 text-sm font-semibold tracking-tight text-wa-body">休憩のモニター</div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge variant="primary" pulse>
                        LIVE
                    </StatusBadge>
                </div>
            </div>

            <div className="mt-4 rounded-sm border border-wa-accent/20 bg-wa-ink p-3">
                <div className="space-y-2 text-sm text-wa-body">
                    <div className="flex items-center justify-between">
                        <div className="text-wa-muted">休憩中</div>
                        <div className="font-semibold text-wa-body">{activeCount}名</div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-wa-muted">これから（約60分以内）</div>
                        <div className="font-semibold text-wa-body">{upcomingCount}名</div>
                    </div>
                    <div className="border-t border-wa-accent/15 pt-2 text-[11px] text-wa-muted">
                        表示範囲 {windowStart}〜{windowEnd}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">実際に休憩中</div>
                <div className="mt-2 space-y-2">
                    {activeRows.length === 0 ? (
                        <div className="rounded-sm border border-dashed border-wa-accent/25 bg-wa-ink px-3 py-3 text-sm text-wa-muted">
                            いま休憩中の人はいません
                        </div>
                    ) : (
                        activeRows.map((r) => {
                            const overtime = nowMin > hhmmToMinutes(r.planned.end_time) + 0.5;
                            return (
                                <div
                                    key={r.user.id}
                                    className="rounded-sm border border-wa-accent/20 bg-wa-card px-3 py-2"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-wa-body">{r.user.name}</div>
                                            <div className="mt-0.5 text-xs text-wa-muted">
                                                割付 {r.planned.start_time} - {r.planned.end_time}
                                            </div>
                                        </div>
                                        <StatusBadge variant={overtime ? 'warning' : 'success'} pulse={overtime}>
                                            {overtime ? '調整中' : '休憩中'}
                                        </StatusBadge>
                                    </div>
                                    {r.note ? <div className="mt-1 text-xs text-wa-muted">メモ: {r.note}</div> : null}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </NordicCard>
    );
}
