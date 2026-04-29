import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DashboardTileLink from '@/Components/DashboardTileLink';
import DetailDrawer from '@/Components/DetailDrawer';
import NeonCard from '@/Components/NeonCard';
import StatusBadge from '@/Components/StatusBadge';
import InformationTrigger from '@/Components/UI/InformationTrigger';
import SlotNumber from '@/Components/UI/SlotNumber';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type RankRow = { rank: number; name: string; ok: number; ng: number; rate: number };
type TrendRow = { label: string; ok: number; ng: number; rate: number };

type SalesPayload = {
    data: {
        summary: { ok: number; ng: number; contract_rate: number };
        ranking: RankRow[];
        trend: TrendRow[];
    };
};

const defaultPayload: SalesPayload = {
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
};

export default function Summary() {
    const { props } = usePage<{ sales?: SalesPayload }>();
    const payload = (props.sales ?? defaultPayload) as SalesPayload;

    const [tab, setTab] = useState<'summary' | 'ranking' | 'trend'>(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab');
        if (t === 'ranking' || t === 'trend' || t === 'summary') return t;
        return 'summary';
    });
    const [drawerRank, setDrawerRank] = useState<RankRow | null>(null);

    const kpi = payload.data.summary;
    const ranking = payload.data.ranking;
    const trend = payload.data.trend;

    const maxTrend = useMemo(() => Math.max(...trend.map((t) => t.ok + t.ng), 1), [trend]);

    const chartData = useMemo(
        () => trend.map((t) => ({ ...t, rate: Number(t.rate.toFixed(1)) })),
        [trend],
    );

    const peakWeek = useMemo(() => {
        if (!trend.length) return null;
        return trend.reduce((best, cur) => (cur.rate > best.rate ? cur : best), trend[0]);
    }, [trend]);

    const go = (href: string) => router.visit(href, { preserveScroll: true });

    // タブ状態をURLに同期（共有しやすくする）
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', tab);
        const next = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', next);
    }, [tab]);

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-semibold tracking-tight text-stone-800">案件・KPI</h2>}>
            <Head title="案件・KPI（サマリー）" />
            <div className="mx-auto max-w-6xl space-y-10 text-stone-700">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">ダッシュボード</div>
                        <StatusBadge variant="muted">MOCK</StatusBadge>
                    </div>
                    <Link
                        href={route('sales.records')}
                        className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/25 transition hover:from-emerald-500/95 hover:to-emerald-600/95"
                    >
                        案件一覧へ
                    </Link>
                </div>

                <div className="flex flex-wrap gap-3">
                    {[
                        { key: 'summary' as const, label: 'サマリー' },
                        { key: 'ranking' as const, label: 'ランキング' },
                        { key: 'trend' as const, label: 'トレンド' },
                    ].map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={
                                'rounded-xl px-5 py-2.5 text-xs font-semibold tracking-tight transition ' +
                                (tab === t.key
                                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/30'
                                    : 'border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50')
                            }
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
                    <NeonCard elevate={false} className="relative p-8">
                        <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">成約率</div>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-5xl font-semibold tracking-tight text-stone-800">
                                <SlotNumber value={kpi.contract_rate.toFixed(1)} />
                            </span>
                            <span className="text-xl font-medium text-stone-500">%</span>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => go(`${route('sales.records')}?status=ok`)}
                                onKeyDown={(e) => {
                                    if (e.key !== 'Enter' && e.key !== ' ') return;
                                    e.preventDefault();
                                    go(`${route('sales.records')}?status=ok`);
                                }}
                                className="cursor-pointer rounded-xl border border-stone-100 bg-stone-50 p-4 transition hover:border-emerald-200 hover:bg-white"
                            >
                                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">OK</div>
                                <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
                                    <SlotNumber value={kpi.ok} />
                                </div>
                            </div>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => go(`${route('sales.records')}?status=ng`)}
                                onKeyDown={(e) => {
                                    if (e.key !== 'Enter' && e.key !== ' ') return;
                                    e.preventDefault();
                                    go(`${route('sales.records')}?status=ng`);
                                }}
                                className="cursor-pointer rounded-xl border border-stone-100 bg-stone-50 p-4 transition hover:border-rose-200 hover:bg-white"
                            >
                                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">NG</div>
                                <div className="mt-1 text-2xl font-semibold tabular-nums text-red-700">
                                    <SlotNumber value={kpi.ng} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, kpi.contract_rate))}%` }}
                            />
                        </div>
                        <div className="mt-6">
                            <InformationTrigger label="指標の見方・計算式">
                                成約率は OK ÷（OK + NG）× 100 で算出します。分母が 0 のときは 0 として扱います。数値が更新されると、上の数字がスロットのように切り替わる演出になります。
                            </InformationTrigger>
                        </div>
                    </NeonCard>

                    <NeonCard elevate={false} className="space-y-8 p-8 lg:col-span-2">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">チャート</div>
                            <div className="mt-2 text-lg font-semibold tracking-tight text-stone-800">週次の推移と成約率</div>
                        </div>

                        <div className="h-72 w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#e7e5e4" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fill: '#78716c', fontSize: 11 }} />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fill: '#78716c', fontSize: 11 }}
                                        allowDecimals={false}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        domain={[0, 100]}
                                        tick={{ fill: '#78716c', fontSize: 11 }}
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#fafaf9',
                                            border: '1px solid #e7e5e4',
                                            borderRadius: '12px',
                                        }}
                                        labelStyle={{ color: '#44403c' }}
                                        itemStyle={{ fontSize: 12, color: '#57534e' }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: 11, color: '#78716c' }}
                                        formatter={(value) => <span className="text-stone-600">{value}</span>}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="ok"
                                        name="OK"
                                        stroke="#059669"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: '#059669' }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="ng"
                                        name="NG"
                                        stroke="#dc2626"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: '#dc2626' }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="rate"
                                        name="成約率"
                                        stroke="#0d9488"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: '#0d9488' }}
                                        activeDot={{ r: 5 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="overflow-x-auto">
                            {tab === 'summary' ? (
                                <div className="space-y-3 rounded-2xl border border-stone-100 bg-stone-50 p-6 text-sm leading-relaxed text-stone-600">
                                    <div>
                                        合計件数:{' '}
                                        <span className="font-semibold text-stone-800">
                                            <SlotNumber value={kpi.ok + kpi.ng} />
                                        </span>
                                        （OK <SlotNumber value={kpi.ok} /> / NG <SlotNumber value={kpi.ng} />）
                                    </div>
                                    {peakWeek ? (
                                        <div>
                                            直近の成約率ピーク:{' '}
                                            <span className="font-semibold text-emerald-700">
                                                {peakWeek.label}（{peakWeek.rate.toFixed(1)}%）
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {tab === 'ranking' ? (
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                                            <th className="border-b border-stone-200 px-4 py-3">順位</th>
                                            <th className="border-b border-stone-200 px-4 py-3">名前</th>
                                            <th className="border-b border-stone-200 px-4 py-3">OK</th>
                                            <th className="border-b border-stone-200 px-4 py-3">NG</th>
                                            <th className="border-b border-stone-200 px-4 py-3">率</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranking.map((r) => (
                                            <tr
                                                key={r.rank}
                                                className="cursor-pointer transition-colors hover:bg-stone-50"
                                                onClick={() => setDrawerRank(r)}
                                            >
                                                <td className="border-b border-stone-100 px-4 py-4 text-stone-600">
                                                    <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                                                        {r.rank}
                                                    </span>
                                                </td>
                                                <td className="border-b border-stone-100 px-4 py-4 font-medium text-stone-800">
                                                    {r.name}
                                                </td>
                                                <td className="border-b border-stone-100 px-4 py-4 font-semibold text-emerald-700">
                                                    {r.ok}
                                                </td>
                                                <td className="border-b border-stone-100 px-4 py-4 font-semibold text-red-700">
                                                    {r.ng}
                                                </td>
                                                <td className="border-b border-stone-100 px-4 py-4 text-stone-700">
                                                    {r.rate.toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : null}

                            {tab === 'trend' ? (
                                <div className="space-y-4">
                                    {trend.map((t) => {
                                        const total = t.ok + t.ng;
                                        const w = Math.round((total / maxTrend) * 100);
                                        return (
                                            <div
                                                key={t.label}
                                                className="rounded-2xl border border-stone-100 bg-white px-5 py-5 shadow-sm transition hover:shadow-nordic-hover"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-semibold text-stone-800">{t.label}</div>
                                                    <div className="text-xs font-medium text-stone-500">
                                                        OK {t.ok} / NG {t.ng} / {t.rate.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                                        style={{ width: `${w}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </NeonCard>
                </div>

                <NeonCard elevate={false} className="p-8">
                    <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">ショートカット</div>
                    <div className="mt-2 text-sm font-semibold text-stone-800">関連画面</div>
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <DashboardTileLink
                            title="案件データ"
                            description="一覧・検索・フィルタ"
                            href={route('sales.records')}
                            badge={{ label: 'LIST', variant: 'primary' }}
                        />
                        <DashboardTileLink
                            title="業務依頼"
                            description="タスク・依頼管理"
                            href={route('task-requests.index')}
                            badge={{ label: 'TASK', variant: 'success' }}
                        />
                        <DashboardTileLink
                            title="商材カタログ"
                            description="トーク・マニュアル"
                            href={route('products.index')}
                            badge={{ label: 'DOC', variant: 'muted' }}
                        />
                        <DashboardTileLink
                            title="社内情報"
                            description="周知・お知らせ"
                            href={route('notices.index')}
                            badge={{ label: 'INFO', variant: 'primary', pulse: true }}
                        />
                    </div>
                </NeonCard>
            </div>

            <DetailDrawer
                open={drawerRank !== null}
                title={drawerRank ? `${drawerRank.rank}位 · ${drawerRank.name}` : ''}
                onClose={() => setDrawerRank(null)}
            >
                {drawerRank ? (
                    <div className="space-y-6 text-sm">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">OK</div>
                                <div className="mt-1 text-2xl font-semibold text-emerald-700">{drawerRank.ok}</div>
                            </div>
                            <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">NG</div>
                                <div className="mt-1 text-2xl font-semibold text-red-700">{drawerRank.ng}</div>
                            </div>
                            <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">成約率</div>
                                <div className="mt-1 text-2xl font-semibold text-teal-700">{drawerRank.rate.toFixed(1)}%</div>
                            </div>
                        </div>
                        <Link
                            href={route('sales.records')}
                            className="inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
                        >
                            案件一覧で詳細を見る
                        </Link>
                    </div>
                ) : null}
            </DetailDrawer>
        </AuthenticatedLayout>
    );
}
