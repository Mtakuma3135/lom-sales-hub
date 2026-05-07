import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DashboardTileLink from '@/Components/DashboardTileLink';
import DetailDrawer from '@/Components/DetailDrawer';
import StatusBadge from '@/Components/StatusBadge';
import InformationTrigger from '@/Components/UI/InformationTrigger';
import SlotNumber from '@/Components/UI/SlotNumber';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
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

const CHART_GRID = 'rgba(192, 132, 87, 0.14)';
const CHART_AXIS = '#a8a29e';
const CHART_OK = '#5eead4';
const CHART_NG = '#f87171';
const CHART_RATE = '#C08457';

function WaCard({ className = '', children }: { className?: string; children: ReactNode }) {
    return (
        <div className={`border border-wa-accent/20 bg-wa-card ${className}`}>
            {children}
        </div>
    );
}

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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', tab);
        const next = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', next);
    }, [tab]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="wa-body-track text-sm font-semibold text-wa-body">案件・KPI</h2>
            }
        >
            <Head title="案件・KPI（サマリー）" />
            <div className="mx-auto max-w-6xl wa-body-track space-y-14 sm:space-y-16">
                    <div className="flex flex-wrap items-center justify-between gap-9">
                        <div className="flex items-center gap-4">
                            <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">
                                ダッシュボード
                            </div>
                            <StatusBadge
                                variant="muted"
                                className="!rounded-sm !border-wa-accent/25 !bg-wa-ink !text-wa-muted !ring-0"
                            >
                                MOCK
                            </StatusBadge>
                        </div>
                        <Link
                            href={route('sales.records')}
                            className="rounded-sm border border-wa-accent/30 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-wa-accent transition hover:border-wa-accent/50 hover:bg-wa-accent/10"
                        >
                            案件一覧へ
                        </Link>
                    </div>

                    <div className="flex flex-wrap gap-4">
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
                                    'rounded-sm px-6 py-3 text-xs font-semibold transition ' +
                                    (tab === t.key
                                        ? 'border border-wa-accent/45 bg-wa-card text-wa-accent'
                                        : 'border border-wa-accent/20 bg-transparent text-wa-muted hover:border-wa-accent/30 hover:text-wa-body')
                                }
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-14">
                        <WaCard className="p-12">
                            <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">成約率</div>
                            <div className="mt-6 flex items-baseline gap-2">
                                <span className="wa-nums text-5xl font-semibold tracking-tight text-wa-body">
                                    <SlotNumber value={kpi.contract_rate.toFixed(1)} />
                                </span>
                                <span className="text-xl font-medium text-wa-muted">%</span>
                            </div>
                            <div className="mt-10 grid grid-cols-2 gap-6">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => go(`${route('sales.records')}?status=ok`)}
                                    onKeyDown={(e) => {
                                        if (e.key !== 'Enter' && e.key !== ' ') return;
                                        e.preventDefault();
                                        go(`${route('sales.records')}?status=ok`);
                                    }}
                                    className="cursor-pointer border border-wa-accent/20 bg-wa-ink p-6 transition hover:border-wa-accent/35"
                                >
                                    <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">OK</div>
                                    <div className="wa-nums mt-2 text-2xl font-semibold text-teal-300">
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
                                    className="cursor-pointer border border-wa-accent/20 bg-wa-ink p-6 transition hover:border-wa-accent/35"
                                >
                                    <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">NG</div>
                                    <div className="wa-nums mt-2 text-2xl font-semibold text-red-400">
                                        <SlotNumber value={kpi.ng} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 h-2 w-full bg-wa-subtle">
                                <div
                                    className="h-full bg-wa-accent transition-all"
                                    style={{ width: `${Math.min(100, Math.max(0, kpi.contract_rate))}%` }}
                                />
                            </div>
                            <div className="mt-8">
                                <InformationTrigger label="指標の見方・計算式">
                                    成約率は OK ÷（OK + NG）× 100 で算出します。分母が 0 のときは 0 として扱います。数値が更新されると、上の数字がスロットのように切り替わる演出になります。
                                </InformationTrigger>
                            </div>
                        </WaCard>

                        <WaCard className="space-y-10 p-12 lg:col-span-2">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">チャート</div>
                                <div className="mt-3 text-lg font-semibold text-wa-body">週次の推移と成約率</div>
                            </div>

                            <div className="h-72 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                        <CartesianGrid stroke={CHART_GRID} vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: CHART_AXIS, fontSize: 11 }} />
                                        <YAxis
                                            yAxisId="left"
                                            tick={{ fill: CHART_AXIS, fontSize: 11 }}
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            domain={[0, 100]}
                                            tick={{ fill: CHART_AXIS, fontSize: 11 }}
                                            tickFormatter={(v) => `${v}%`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#222222',
                                                border: '1px solid rgba(192, 132, 87, 0.22)',
                                                borderRadius: '2px',
                                            }}
                                            labelStyle={{ color: '#d6d3d1' }}
                                            itemStyle={{ fontSize: 12, color: '#a8a29e' }}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: 11, color: CHART_AXIS }}
                                            formatter={(value) => <span className="text-wa-muted">{value}</span>}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="ok"
                                            name="OK"
                                            stroke={CHART_OK}
                                            strokeWidth={1.5}
                                            dot={{ r: 2, fill: CHART_OK }}
                                            activeDot={{ r: 4 }}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="ng"
                                            name="NG"
                                            stroke={CHART_NG}
                                            strokeWidth={1.5}
                                            dot={{ r: 2, fill: CHART_NG }}
                                            activeDot={{ r: 4 }}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="rate"
                                            name="成約率"
                                            stroke={CHART_RATE}
                                            strokeWidth={1.5}
                                            dot={{ r: 2, fill: CHART_RATE }}
                                            activeDot={{ r: 4 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="overflow-x-auto">
                                {tab === 'summary' ? (
                                    <div className="space-y-4 border border-wa-accent/20 bg-wa-ink p-8 text-sm leading-relaxed text-wa-muted">
                                        <div>
                                            合計件数:{' '}
                                            <span className="wa-nums font-semibold text-wa-body">
                                                <SlotNumber value={kpi.ok + kpi.ng} />
                                            </span>
                                            （OK <SlotNumber value={kpi.ok} /> / NG <SlotNumber value={kpi.ng} />）
                                        </div>
                                        {peakWeek ? (
                                            <div>
                                                直近の成約率ピーク:{' '}
                                                <span className="font-semibold text-wa-accent">
                                                    {peakWeek.label}（{peakWeek.rate.toFixed(1)}%）
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {tab === 'ranking' ? (
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-wa-muted">
                                                <th className="border-b border-wa-accent/20 px-5 py-4">順位</th>
                                                <th className="border-b border-wa-accent/20 px-5 py-4">名前</th>
                                                <th className="border-b border-wa-accent/20 px-5 py-4">OK</th>
                                                <th className="border-b border-wa-accent/20 px-5 py-4">NG</th>
                                                <th className="border-b border-wa-accent/20 px-5 py-4">率</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ranking.map((r) => (
                                                <tr
                                                    key={r.rank}
                                                    className="cursor-pointer transition-colors hover:bg-wa-ink"
                                                    onClick={() => setDrawerRank(r)}
                                                >
                                                    <td className="border-b border-wa-accent/15 px-5 py-5 text-wa-muted">
                                                        <span className="inline-flex min-w-9 items-center justify-center border border-wa-accent/25 bg-wa-ink px-2 py-1 text-xs font-semibold text-wa-accent">
                                                            {r.rank}
                                                        </span>
                                                    </td>
                                                    <td className="border-b border-wa-accent/15 px-5 py-5 font-medium text-wa-body">
                                                        {r.name}
                                                    </td>
                                                    <td className="wa-nums border-b border-wa-accent/15 px-5 py-5 font-semibold text-teal-300">
                                                        {r.ok}
                                                    </td>
                                                    <td className="wa-nums border-b border-wa-accent/15 px-5 py-5 font-semibold text-red-400">
                                                        {r.ng}
                                                    </td>
                                                    <td className="wa-nums border-b border-wa-accent/15 px-5 py-5 text-wa-body">
                                                        {r.rate.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : null}

                                {tab === 'trend' ? (
                                    <div className="space-y-6">
                                        {trend.map((t) => {
                                            const total = t.ok + t.ng;
                                            const w = Math.round((total / maxTrend) * 100);
                                            return (
                                                <div
                                                    key={t.label}
                                                    className="border border-wa-accent/20 bg-wa-ink px-8 py-8 transition hover:border-wa-accent/30"
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="text-sm font-semibold text-wa-body">{t.label}</div>
                                                        <div className="wa-nums text-xs font-medium text-wa-muted">
                                                            OK {t.ok} / NG {t.ng} / {t.rate.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    <div className="mt-6 h-2 w-full bg-wa-subtle">
                                                        <div className="h-full bg-wa-accent" style={{ width: `${w}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        </WaCard>
                    </div>

                    <div className="border border-wa-accent/20 bg-wa-card p-12">
                        <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">ショートカット</div>
                        <div className="mt-3 text-sm font-semibold text-wa-body">関連画面</div>
                        <div className="mt-10 grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-4">
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
                                title="周知事項"
                                description="周知・お知らせ"
                                href={route('notices.index')}
                                badge={{ label: 'INFO', variant: 'primary', pulse: true }}
                            />
                        </div>
                    </div>
            </div>

            <DetailDrawer
                open={drawerRank !== null}
                title={drawerRank ? `${drawerRank.rank}位 · ${drawerRank.name}` : ''}
                onClose={() => setDrawerRank(null)}
            >
                {drawerRank ? (
                    <div className="space-y-8 text-sm">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div className="border border-wa-accent/20 bg-wa-ink px-5 py-5">
                                <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">OK</div>
                                <div className="wa-nums mt-2 text-2xl font-semibold text-teal-300">{drawerRank.ok}</div>
                            </div>
                            <div className="border border-wa-accent/20 bg-wa-ink px-5 py-5">
                                <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">NG</div>
                                <div className="wa-nums mt-2 text-2xl font-semibold text-red-400">{drawerRank.ng}</div>
                            </div>
                            <div className="border border-wa-accent/20 bg-wa-ink px-5 py-5">
                                <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">成約率</div>
                                <div className="wa-nums mt-2 text-2xl font-semibold text-wa-accent">
                                    {drawerRank.rate.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                        <Link
                            href={route('sales.records')}
                            className="inline-flex rounded-sm border border-wa-accent/30 px-5 py-2.5 text-xs font-semibold text-wa-accent transition hover:border-wa-accent/45 hover:bg-wa-accent/10"
                        >
                            案件一覧で詳細を見る
                        </Link>
                    </div>
                ) : null}
            </DetailDrawer>
        </AuthenticatedLayout>
    );
}
