/**
 * 休憩カウントダウン中のみ、ランナーが左→右へループする簡易アニメーション
 */
export default function BreakRunner({
    active,
    remainingMs,
    label,
    totalMs = 60 * 60 * 1000,
    accent = 'copper',
}: {
    active: boolean;
    remainingMs: number;
    label?: string;
    totalMs?: number;
    accent?: 'copper' | 'emerald' | 'sky' | 'amber';
}) {
    const fmt = (ms: number) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    const elapsedMs = Math.max(0, totalMs - Math.max(0, remainingMs));
    const pct = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
    const accentBar =
        accent === 'sky' ? 'bg-sky-500' : accent === 'amber' ? 'bg-amber-500' : 'bg-wa-accent';

    return (
        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">休憩</div>
                <div
                    className={
                        'wa-nums font-mono text-lg font-bold tabular-nums ' +
                        (active ? 'text-wa-accent' : 'text-wa-muted')
                    }
                >
                    {active ? fmt(remainingMs) : '—'}
                </div>
            </div>
            {label ? <div className="mt-2 text-sm font-semibold text-wa-body">{label}</div> : null}
            <div className="relative mt-4 overflow-hidden rounded-sm border border-wa-accent/20 bg-wa-card">
                <div className="h-10">
                    <div className="absolute inset-0">
                        <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 bg-wa-subtle" />
                        <div
                            className={`absolute left-0 top-1/2 h-2 -translate-y-1/2 transition-[width] duration-500 ease-out ${accentBar}`}
                            style={{ width: active ? `${pct}%` : '0%' }}
                            aria-hidden
                        />
                    </div>
                    {active ? (
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 text-xl leading-none transition-[left] duration-500 ease-out`}
                            style={{ left: `calc(${pct}% - 0.5rem)` }}
                            aria-hidden
                        >
                            🏃
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs font-medium text-wa-muted">
                            待機中
                        </div>
                    )}
                </div>
                <div className="border-t border-wa-accent/20 px-3 py-2 text-[11px] font-medium text-wa-muted">
                    {active ? `進捗 ${Math.round(pct)}%` : '開始すると1時間で完走します'}
                </div>
            </div>
        </div>
    );
}
