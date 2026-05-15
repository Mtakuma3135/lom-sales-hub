/**
 * 休憩カウントダウン中のみ、ランナーが左→右へループする簡易アニメーション
 */
export default function BreakRunner({
    active,
    remainingMs,
    overrun = false,
    overrunMs = 0,
    label,
    totalMs = 60 * 60 * 1000,
    accent = 'copper',
    frozenRemainingMs = null,
}: {
    active: boolean;
    remainingMs: number;
    overrun?: boolean;
    overrunMs?: number;
    label?: string;
    totalMs?: number;
    accent?: 'copper' | 'emerald' | 'sky' | 'amber' | 'violet' | 'rose';
    /** 一時停止中: タイマー表示のみ（バーは進行しない） */
    frozenRemainingMs?: number | null;
}) {
    const fmt = (ms: number) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    const frozen = frozenRemainingMs != null && Number.isFinite(frozenRemainingMs);
    const displayMs = frozen ? Math.max(0, frozenRemainingMs as number) : overrun ? overrunMs : active ? remainingMs : 0;
    const elapsedMs = overrun
        ? totalMs + Math.max(0, overrunMs)
        : frozen
          ? totalMs - displayMs
          : Math.max(0, totalMs - Math.max(0, remainingMs));
    const pct =
        frozen
            ? totalMs > 0
                ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
                : 0
            : !overrun && totalMs > 0
              ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
              : overrun
                ? 100
                : 0;
    const accentBar = overrun
        ? 'bg-red-500'
        : accent === 'emerald'
          ? 'bg-emerald-500'
          : accent === 'sky'
            ? 'bg-sky-500'
            : accent === 'amber'
              ? 'bg-amber-500'
              : accent === 'violet'
                ? 'bg-violet-500'
                : accent === 'rose'
                  ? 'bg-rose-500'
                  : 'bg-wa-accent';
    const accentGlow = overrun
        ? 'bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.35)]'
        : accent === 'emerald'
          ? 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.30)]'
          : accent === 'sky'
            ? 'bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.35)]'
            : accent === 'amber'
              ? 'bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.30)]'
              : accent === 'violet'
                ? 'bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.35)]'
                : accent === 'rose'
                  ? 'bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.35)]'
                  : 'bg-wa-accent shadow-[0_0_18px_rgba(192,132,87,0.28)]';

    return (
        <div
            className={
                'rounded-xl border px-4 py-4 ' +
                (overrun ? 'border-red-500/40 bg-red-500/15' : 'border-wa-accent/15 bg-wa-ink')
            }
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">休憩</div>
                <div
                    className={
                        'wa-nums font-mono text-lg font-bold tabular-nums ' +
                        (overrun ? 'text-red-300' : active || frozen ? 'text-wa-accent' : 'text-wa-muted')
                    }
                >
                    {overrun ? `+${fmt(overrunMs)}` : active || frozen ? fmt(displayMs) : '—'}
                </div>
            </div>
            {label ? <div className="mt-2 text-sm font-semibold text-wa-body">{label}</div> : null}
            <div className="relative mt-4 overflow-hidden rounded-xl border border-wa-accent/15 bg-wa-card">
                <div className="h-10">
                    <div className="absolute inset-0">
                        <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 bg-wa-subtle" />
                        <div
                            className={`absolute left-0 top-1/2 h-2 -translate-y-1/2 transition-[width] duration-500 ease-out ${accentBar}`}
                            style={{ width: active || frozen ? `${pct}%` : '0%' }}
                            aria-hidden
                        />
                    </div>
                    {active || frozen ? (
                        <>
                            <div
                                className={`pointer-events-none absolute top-1 bottom-1 w-[2px] ${accentGlow} transition-[left] duration-500 ease-out`}
                                style={{ left: overrun ? 'calc(100% - 2px)' : `calc(${pct}% - 1px)` }}
                                aria-hidden
                            />
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs font-medium text-wa-muted">
                            待機中
                        </div>
                    )}
                </div>
                <div className="border-t border-wa-accent/15 px-3 py-2 text-[11px] font-medium text-wa-muted">
                    {overrun
                        ? `規定時間（${Math.round(totalMs / 60000)}分）を超過しています`
                        : frozen
                          ? '一時停止中（スタートで再開）'
                          : active
                            ? `進捗 ${Math.round(pct)}%`
                            : '開始すると1時間で完走します'}
                </div>
            </div>
        </div>
    );
}
