import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Summary() {
    type SalesPayload = {
        data: {
            summary: { ok: number; ng: number; contract_rate: number };
            ranking: { rank: number; name: string; ok: number; ng: number; rate: number }[];
            trend: { label: string; ok: number; ng: number; rate: number }[];
        };
    };

    const { props } = usePage<{ sales?: SalesPayload }>();
    const sales = props.sales;
    // Inertiaからpropsで来る想定だが、万一未注入でもUIが落ちないようデフォルトを持つ
    const payload: SalesPayload = (sales ??
        ({
            data: {
                summary: { ok: 137, ng: 63, contract_rate: 68.5 },
                ranking: [
                    { rank: 1, name: '山田太郎', ok: 34, ng: 9, rate: 79.1 },
                    { rank: 2, name: '佐藤花子', ok: 29, ng: 11, rate: 72.5 },
                    { rank: 3, name: '鈴木一郎', ok: 24, ng: 12, rate: 66.7 },
                    { rank: 4, name: '高橋次郎', ok: 21, ng: 14, rate: 60.0 },
                    { rank: 5, name: '田中美咲', ok: 19, ng: 17, rate: 52.8 },
                ],
                trend: [
                    { label: 'W1', ok: 28, ng: 19, rate: 59.6 },
                    { label: 'W2', ok: 33, ng: 14, rate: 70.2 },
                    { label: 'W3', ok: 38, ng: 12, rate: 76.0 },
                    { label: 'W4', ok: 38, ng: 18, rate: 67.9 },
                ],
            },
        } as SalesPayload)) as SalesPayload;

    const [tab, setTab] = useState<'summary' | 'ranking' | 'trend'>('summary');

    const kpi = payload.data.summary;
    const ranking = payload.data.ranking;
    const trend = payload.data.trend;

    const maxTrend = useMemo(() => {
        const max = Math.max(...trend.map((t) => t.ok + t.ng), 1);
        return max;
    }, [trend]);

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">KPI / SUMMARY</h2>}>
            <Head title="案件・KPI（サマリー）" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs font-bold tracking-widest text-white/60">KPI</div>
                    <Link
                        href={route('sales.records')}
                        className="rounded-2xl bg-gradient-to-r from-purple-500/30 to-cyan-400/20 px-4 py-2 text-xs font-black tracking-widest text-white shadow-[0_0_0_1px_rgba(34,211,238,0.14)] hover:brightness-110"
                    >
                        案件一覧へ
                    </Link>
                </div>
                {/* タブ */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {[
                        { key: 'summary', label: 'SUMMARY' },
                        { key: 'ranking', label: 'RANKING' },
                        { key: 'trend', label: 'TREND' },
                    ].map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key as any)}
                            className={
                                'rounded-2xl px-4 py-2 text-xs font-black tracking-widest transition ' +
                                (tab === (t.key as any)
                                    ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)]'
                                    : 'bg-white/5 text-white/70 ring-1 ring-inset ring-white/10 hover:bg-white/10')
                            }
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* 成約率カード */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="pointer-events-none absolute -inset-24 bg-gradient-to-br from-purple-500/25 to-cyan-400/15 blur-3xl" />
                        <div className="relative text-xs font-bold tracking-widest text-white/60">
                            CONTRACT RATE
                        </div>
                        <div className="mt-3 flex items-end gap-2">
                            <div className="text-5xl font-black tracking-tighter text-white">
                                {kpi.contract_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs font-semibold text-cyan-200/80">MOCK</div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="text-[11px] font-bold tracking-widest text-white/50">
                                    OK
                                </div>
                                <div className="mt-1 text-2xl font-black text-emerald-300">
                                    {kpi.ok}
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="text-[11px] font-bold tracking-widest text-white/50">
                                    NG
                                </div>
                                <div className="mt-1 text-2xl font-black text-rose-300">
                                    {kpi.ng}
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                                style={{ width: `${Math.min(100, Math.max(0, kpi.contract_rate))}%` }}
                            />
                        </div>
                        <div className="mt-3 text-xs text-white/55">
                            計算式: \(ok / (ok + ng) × 100\)（0除算は0）
                        </div>
                    </div>

                    {/* ランキング */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">
                                    {tab === 'trend' ? 'TREND' : tab === 'ranking' ? 'LEADERBOARD' : 'LEADERBOARD'}
                                </div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">
                                    {tab === 'trend' ? '推移（週次）' : 'OK数ランキング'}
                                </div>
                            </div>
                            <div className="text-xs font-semibold text-cyan-200/80">MOCK</div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            {tab !== 'trend' ? (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="text-left text-xs text-white/60">
                                            <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">RANK</th>
                                            <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">NAME</th>
                                            <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">OK</th>
                                            <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">NG</th>
                                            <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">RATE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranking.map((r) => (
                                            <tr key={r.rank} className="text-sm hover:bg-white/5 transition-colors">
                                                <td className="border-b border-white/10 px-3 py-3 text-white/80">
                                                    <span className="inline-flex min-w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500/30 to-cyan-400/20 px-2 py-1 text-xs font-black text-white ring-1 ring-inset ring-white/10 shadow-[0_0_20px_rgba(34,211,238,0.20)]">
                                                        {r.rank}
                                                    </span>
                                                </td>
                                                <td className="border-b border-white/10 px-3 py-3 font-semibold text-white">
                                                    {r.name}
                                                </td>
                                                <td className="border-b border-white/10 px-3 py-3 text-emerald-300 font-black">
                                                    {r.ok}
                                                </td>
                                                <td className="border-b border-white/10 px-3 py-3 text-rose-300 font-black">
                                                    {r.ng}
                                                </td>
                                                <td className="border-b border-white/10 px-3 py-3 text-white/85 font-semibold">
                                                    {r.rate.toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="space-y-3">
                                    {trend.map((t) => {
                                        const total = t.ok + t.ng;
                                        const w = Math.round((total / maxTrend) * 100);
                                        return (
                                            <div
                                                key={t.label}
                                                className="rounded-2xl border border-white/10 bg-[#0b1020]/55 px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-black tracking-tight text-white">
                                                        {t.label}
                                                    </div>
                                                    <div className="text-xs font-semibold text-white/55">
                                                        OK {t.ok} / NG {t.ng} / {t.rate.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                                                        style={{ width: `${w}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

