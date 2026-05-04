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
        <NordicCard elevate={false} className="p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">ActiveStatusPanel</div>
                    <div className="mt-2 text-lg font-semibold tracking-tight text-stone-800">休憩モニタリング</div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge variant="primary" pulse>
                        LIVE
                    </StatusBadge>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-stone-100 bg-stone-50/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">要約</div>
                <div className="mt-2 space-y-2 text-sm text-stone-700">
                    <div className="flex items-center justify-between">
                        <div className="text-stone-500">現在休憩中</div>
                        <div className="font-semibold text-stone-800">{activeCount}名</div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-stone-500">これから（〜60分）</div>
                        <div className="font-semibold text-stone-800">{upcomingCount}名</div>
                    </div>
                    <div className="mt-3 text-[11px] text-stone-500">
                        監視範囲: {windowStart} - {windowEnd}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">実稼働</div>
                <div className="mt-2 space-y-2">
                    {activeRows.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-stone-200 bg-white/60 px-4 py-4 text-sm text-stone-500">
                            休憩中の人はいません
                        </div>
                    ) : (
                        activeRows.map((r) => {
                            const overtime = nowMin > hhmmToMinutes(r.planned.end_time) + 0.5;
                            return (
                                <div
                                    key={r.user.id}
                                    className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/60"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-black tracking-tight text-stone-900">
                                                {r.user.name}
                                            </div>
                                            <div className="mt-1 text-xs text-stone-500">
                                                予定 {r.planned.start_time} - {r.planned.end_time}
                                            </div>
                                        </div>
                                        <StatusBadge variant={overtime ? 'warning' : 'success'} pulse={overtime}>
                                            {overtime ? '調整中' : '休憩中'}
                                        </StatusBadge>
                                    </div>
                                    {r.note ? <div className="mt-2 text-xs text-stone-600">理由: {r.note}</div> : null}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </NordicCard>
    );
}

