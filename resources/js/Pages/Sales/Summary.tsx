import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CsvUploadPanel from '@/Components/Sales/CsvUploadPanel';
import DetailDrawer from '@/Components/DetailDrawer';
import StatusBadge from '@/Components/StatusBadge';
import InformationTrigger from '@/Components/UI/InformationTrigger';
import SlotNumber from '@/Components/UI/SlotNumber';
import { nextDir, type SortDir, SortableTh } from '@/Components/SortableTh';
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

type KpiTriplet = { ok: number; ng: number; contract_rate: number };

const emptyPayload: SalesPayload = {
    data: {
        summary: { ok: 0, ng: 0, contract_rate: 0 },
        ranking: [],
        trend: [],
    },
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

/** ローカルプレビュー用（Inertia 未接続時） */
const defaultPersonalKpi: KpiTriplet = { ok: 19, ng: 17, contract_rate: 52.8 };

function recordsQueryHref(status: 'ok' | 'ng', keyword?: string): string {
    const q = new URLSearchParams();
    q.set('status', status);
    const k = keyword?.trim();
    if (k) {
        q.set('keyword', k);
    }
    return `${route('sales.records')}?${q.toString()}`;
}

function KpiScoreColumn({
    eyebrow,
    kpi,
    okHref,
    ngHref,
    variant,
    impact = false,
}: {
    eyebrow: string;
    kpi: KpiTriplet;
    okHref: string;
    ngHref: string;
    variant: 'team' | 'personal';
    impact?: boolean;
}) {
    const shell =
        variant === 'team'
            ? 'rounded-xl border border-wa-accent/15 bg-wa-ink/70 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]'
            : 'rounded-xl bg-wa-ink/70';

    const okNgTile =
        variant === 'team'
            ? 'rounded-xl border border-wa-accent/15 bg-wa-ink/90 transition hover:border-wa-accent/35 hover:bg-wa-ink'
            : 'rounded-xl bg-wa-ink/55 transition hover:bg-wa-ink/75';

    const rateCls = impact
        ? 'wa-nums text-5xl font-semibold tracking-tight text-wa-body sm:text-6xl md:text-7xl'
        : 'wa-nums text-4xl font-semibold tracking-tight text-wa-body sm:text-5xl';
    const pctCls = impact ? 'text-2xl font-medium text-wa-muted sm:text-3xl' : 'text-lg font-medium text-wa-muted sm:text-xl';
    const okNgCls = impact
        ? 'wa-nums mt-3 text-2xl font-semibold sm:text-3xl'
        : 'wa-nums mt-2 text-xl font-semibold sm:text-2xl';
    const barH = impact ? 'h-3' : 'h-2';
    const pad = impact ? 'p-9 sm:p-10 lg:p-11' : 'p-8 lg:p-9';

    return (
        <div className={`flex flex-col border ${shell} ${pad}`}>
            <div
                className={
                    impact
                        ? 'text-[11px] font-bold uppercase tracking-[0.22em] text-wa-muted'
                        : 'text-[10px] font-bold uppercase tracking-widest text-wa-muted'
                }
            >
                {eyebrow}
            </div>
            <div className={impact ? 'mt-6 flex items-baseline gap-2' : 'mt-5 flex items-baseline gap-2'}>
                <span className={rateCls}>
                    <SlotNumber value={kpi.contract_rate.toFixed(1)} />
                </span>
                <span className={pctCls}>%</span>
            </div>
            <div className={impact ? 'mt-10 grid grid-cols-2 gap-4 sm:gap-6' : 'mt-8 grid grid-cols-2 gap-4 sm:gap-5'}>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => router.visit(okHref, { preserveScroll: true })}
                    onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        router.visit(okHref, { preserveScroll: true });
                    }}
                    className={`cursor-pointer p-6 ${okNgTile}`}
                >
                    <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">OK</div>
                    <div className={`${okNgCls} text-teal-300`}>
                        <SlotNumber value={kpi.ok} />
                    </div>
                </div>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => router.visit(ngHref, { preserveScroll: true })}
                    onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        router.visit(ngHref, { preserveScroll: true });
                    }}
                    className={`cursor-pointer p-6 ${okNgTile}`}
                >
                    <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">NG</div>
                    <div className={`${okNgCls} text-red-400`}>
                        <SlotNumber value={kpi.ng} />
                    </div>
                </div>
            </div>
            <div className={`mt-8 w-full overflow-hidden rounded-full bg-wa-subtle ${barH}`}>
                <div
                    className="h-full rounded-full bg-gradient-to-r from-wa-accent/50 via-wa-accent to-wa-accent/85 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, kpi.contract_rate))}%` }}
                />
            </div>
        </div>
    );
}

const CHART_GRID = 'rgba(192, 132, 87, 0.14)';
const CHART_AXIS = '#a8a29e';
const CHART_OK = '#5eead4';
const CHART_NG = '#f87171';
const CHART_RATE = '#C08457';

function WaCard({ className = '', children }: { className?: string; children: ReactNode }) {
    return (
        <div className={['wa-surface', className].filter(Boolean).join(' ')}>
            <div className="relative z-10">{children}</div>
        </div>
    );
}

type SalesKpiTab = 'summary' | 'ranking' | 'trend' | 'csv';

const RANK_SORT_KEYS = ['rank', 'name', 'ok', 'ng', 'rate'] as const;
type RankSortKey = (typeof RANK_SORT_KEYS)[number];

function readRankingSortFromUrl(): { key: RankSortKey; dir: SortDir } {
    const p = new URLSearchParams(window.location.search);
    const raw = p.get('rsort') ?? 'rank';
    const key = (RANK_SORT_KEYS as readonly string[]).includes(raw) ? (raw as RankSortKey) : 'rank';
    const dir = (p.get('rdir') ?? 'asc') === 'desc' ? 'desc' : 'asc';
    return { key, dir };
}

export default function Summary() {
    const { props } = usePage<{ sales?: SalesPayload; personalKpi?: KpiTriplet }>();
    const isDev = import.meta.env.DEV;

    const payload = (props.sales ?? (isDev ? defaultPayload : emptyPayload)) as SalesPayload;
    const personalKpi = (props.personalKpi ?? (isDev ? defaultPersonalKpi : emptyPayload.data.summary)) as KpiTriplet;

    const actorName =
        (props as { auth?: { user?: { name?: string | null } } }).auth?.user?.name?.trim() ?? '';

    const canCsv = Boolean((props as { auth?: { can?: { admin_csv?: boolean } } }).auth?.can?.admin_csv);

    const [tab, setTab] = useState<SalesKpiTab>(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab');
        if (t === 'ranking' || t === 'trend' || t === 'summary') return t;
        if (t === 'csv') return 'csv';
        return 'summary';
    });

    useEffect(() => {
        if (tab === 'csv' && !canCsv) {
            setTab('summary');
        }
    }, [tab, canCsv]);

    const [drawerRank, setDrawerRank] = useState<RankRow | null>(null);
    const [rankingSort, setRankingSort] = useState(() => readRankingSortFromUrl());

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', tab);
        params.set('rsort', rankingSort.key);
        params.set('rdir', rankingSort.dir);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }, [tab, rankingSort]);

    useEffect(() => {
        const onPop = () => {
            const params = new URLSearchParams(window.location.search);
            const t = params.get('tab');
            if (t === 'ranking' || t === 'trend' || t === 'summary') {
                setTab(t);
            } else if (t === 'csv' && canCsv) {
                setTab('csv');
            } else {
                setTab('summary');
            }
            setRankingSort(readRankingSortFromUrl());
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [canCsv]);

    const kpi = payload.data.summary;
    const teamOkHref = recordsQueryHref('ok');
    const teamNgHref = recordsQueryHref('ng');
    const personalOkHref = recordsQueryHref('ok', actorName);
    const personalNgHref = recordsQueryHref('ng', actorName);
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

    const rankingSorted = useMemo(() => {
        const key = rankingSort.key;
        const dir = rankingSort.dir;
        const sign = dir === 'asc' ? 1 : -1;
        return [...ranking].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
            return String(av).localeCompare(String(bv), 'ja') * sign;
        });
    }, [ranking, rankingSort.dir, rankingSort.key]);

    const toggleRankingSort = (key: RankSortKey) => {
        setRankingSort((s) => {
            if (s.key !== key) return { key, dir: 'asc' };
            return { key, dir: nextDir(s.dir) };
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="wa-body-track text-sm font-semibold text-wa-body">案件・KPI</h2>
            }
        >
            <Head title={tab === 'csv' ? '案件・KPI（CSV取り込み）' : '案件・KPI（サマリー）'} />
            <div className="mx-auto max-w-6xl wa-body-track space-y-10 sm:space-y-12">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">
                            ダッシュボード
                        </div>
                        {isDev && props.sales === undefined ? (
                            <StatusBadge
                                variant="muted"
                                className="!rounded-lg !border-wa-accent/25 !bg-wa-ink !text-wa-muted !ring-0"
                            >
                                DEV SAMPLE
                            </StatusBadge>
                        ) : null}
                    </div>
                    <Link
                        href={route('sales.records')}
                        className="rounded-xl border border-wa-accent/35 bg-wa-accent/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-wa-accent transition hover:border-wa-accent/55 hover:bg-wa-accent/18"
                    >
                        案件一覧へ
                    </Link>
                </div>

                <section className="wa-surface">
                    <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-wa-accent">
                                    KPI · THIS MONTH
                                </div>
                                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-wa-body sm:text-4xl md:text-5xl">
                                    今月の成績
                                </h1>
                                <p className="mt-2 max-w-xl text-sm text-wa-muted">
                                    チーム全体とあなた自身の成約率・件数をひと目で比較できます。
                                </p>
                            </div>
                            <div className="hidden shrink-0 text-right text-[10px] font-bold uppercase tracking-widest text-wa-muted sm:block">
                                LIVE BOARD
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                            <KpiScoreColumn
                                variant="team"
                                eyebrow="チーム全体"
                                kpi={kpi}
                                okHref={teamOkHref}
                                ngHref={teamNgHref}
                                impact
                            />
                            <KpiScoreColumn
                                variant="personal"
                                eyebrow="あなたの成績"
                                kpi={personalKpi}
                                okHref={personalOkHref}
                                ngHref={personalNgHref}
                                impact
                            />
                        </div>

                        <div className="mt-10 border-t border-wa-accent/10 pt-8">
                            <InformationTrigger label="指標の見方・計算式">
                                成約率は OK ÷（OK + NG）× 100 で算出します。分母が 0 のときは 0 として扱います。個人の OK / NG
                                を開くと、案件一覧が担当者名で絞り込まれた状態になります（名前が未設定の場合はステータスのみ絞り込み）。
                            </InformationTrigger>
                        </div>
                    </div>
                </section>

                <WaCard className="overflow-hidden">
                    <div className="border-b border-wa-accent/10 bg-wa-ink/35 px-6 py-8 sm:px-10 sm:py-10">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-wa-accent">CHART</div>
                        <div className="mt-2 text-2xl font-semibold tracking-tight text-wa-body sm:text-3xl">
                            週次の推移と成約率
                        </div>
                        <p className="mt-2 max-w-2xl text-sm text-wa-muted">
                            OK / NG の件数と成約率の動きを同じタイムラインで確認できます。
                        </p>
                    </div>

                    <div className="px-4 pb-6 pt-8 sm:px-8">
                        <div className="h-[min(28rem,62vw)] w-full min-w-0 sm:h-[26rem] md:h-[28rem]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
                                    <CartesianGrid stroke={CHART_GRID} vertical={false} />
                                    <XAxis dataKey="label" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fill: CHART_AXIS, fontSize: 12 }}
                                        allowDecimals={false}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        domain={[0, 100]}
                                        tick={{ fill: CHART_AXIS, fontSize: 12 }}
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1c1917',
                                            border: '1px solid rgba(192, 132, 87, 0.28)',
                                            borderRadius: '12px',
                                        }}
                                        labelStyle={{ color: '#e7e5e4' }}
                                        itemStyle={{ fontSize: 13, color: '#a8a29e' }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: 12, color: CHART_AXIS, paddingTop: 16 }}
                                        formatter={(value) => <span className="text-wa-muted">{value}</span>}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="ok"
                                        name="OK"
                                        stroke={CHART_OK}
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: CHART_OK, strokeWidth: 0 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="ng"
                                        name="NG"
                                        stroke={CHART_NG}
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: CHART_NG, strokeWidth: 0 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="rate"
                                        name="成約率"
                                        stroke={CHART_RATE}
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: CHART_RATE, strokeWidth: 0 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="border-t border-wa-accent/10 px-6 pb-10 pt-8 sm:px-10">
                        <div className="flex flex-wrap gap-3">
                            {(
                                [
                                    { key: 'summary' as const, label: 'サマリー' },
                                    { key: 'ranking' as const, label: 'ランキング' },
                                    { key: 'trend' as const, label: 'トレンド' },
                                    ...(canCsv ? [{ key: 'csv' as const, label: 'CSV取り込み' }] : []),
                                ] as const
                            ).map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTab(t.key)}
                                    className={
                                        'rounded-xl px-6 py-3 text-xs font-semibold uppercase tracking-widest transition ' +
                                        (tab === t.key
                                            ? 'border border-wa-accent/45 bg-wa-accent/12 text-wa-accent shadow-[0_0_20px_-10px_rgba(192,132,87,0.4)]'
                                            : 'border border-wa-accent/15 bg-wa-ink/40 text-wa-muted hover:border-wa-accent/30 hover:bg-wa-ink/55 hover:text-wa-body')
                                    }
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 overflow-x-auto">
                            {tab === 'summary' ? (
                                <div className="space-y-4 rounded-xl border border-wa-accent/15 bg-wa-ink/70 p-8 text-sm leading-relaxed text-wa-muted shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
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
                                            <SortableTh
                                                label="順位"
                                                active={rankingSort.key === 'rank'}
                                                dir={rankingSort.dir}
                                                onToggle={() => toggleRankingSort('rank')}
                                                className="border-b border-wa-accent/20 px-5 py-4"
                                            />
                                            <SortableTh
                                                label="名前"
                                                active={rankingSort.key === 'name'}
                                                dir={rankingSort.dir}
                                                onToggle={() => toggleRankingSort('name')}
                                                className="border-b border-wa-accent/20 px-5 py-4"
                                            />
                                            <SortableTh
                                                label="OK"
                                                active={rankingSort.key === 'ok'}
                                                dir={rankingSort.dir}
                                                onToggle={() => toggleRankingSort('ok')}
                                                className="border-b border-wa-accent/20 px-5 py-4"
                                            />
                                            <SortableTh
                                                label="NG"
                                                active={rankingSort.key === 'ng'}
                                                dir={rankingSort.dir}
                                                onToggle={() => toggleRankingSort('ng')}
                                                className="border-b border-wa-accent/20 px-5 py-4"
                                            />
                                            <SortableTh
                                                label="率"
                                                active={rankingSort.key === 'rate'}
                                                dir={rankingSort.dir}
                                                onToggle={() => toggleRankingSort('rate')}
                                                className="border-b border-wa-accent/20 px-5 py-4"
                                            />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rankingSorted.map((r) => (
                                            <tr
                                                key={r.rank}
                                                className="cursor-pointer transition-colors hover:bg-wa-ink"
                                                onClick={() => setDrawerRank(r)}
                                            >
                                                <td className="border-b border-wa-accent/15 px-5 py-5 text-wa-muted">
                                                    <span className="inline-flex min-w-9 items-center justify-center rounded-lg border border-wa-accent/25 bg-wa-ink px-2 py-1 text-xs font-semibold text-wa-accent">
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
                                                className="rounded-xl border border-wa-accent/15 bg-wa-ink/70 px-8 py-8 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] transition hover:border-wa-accent/28"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="text-sm font-semibold text-wa-body">{t.label}</div>
                                                    <div className="wa-nums text-xs font-medium text-wa-muted">
                                                        OK {t.ok} / NG {t.ng} / {t.rate.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-wa-subtle">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-wa-accent/60 to-wa-accent" style={{ width: `${w}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}

                            {tab === 'csv' && canCsv ? <CsvUploadPanel /> : null}
                        </div>
                    </div>
                </WaCard>
            </div>

            <DetailDrawer
                open={drawerRank !== null}
                title={drawerRank ? `${drawerRank.rank}位 · ${drawerRank.name}` : ''}
                onClose={() => setDrawerRank(null)}
            >
                {drawerRank ? (
                    <div className="space-y-8 text-sm">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div className="rounded-xl border border-wa-accent/15 bg-wa-ink/70 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
                                <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">OK</div>
                                <div className="wa-nums mt-2 text-2xl font-semibold text-teal-300">{drawerRank.ok}</div>
                            </div>
                            <div className="rounded-xl border border-wa-accent/15 bg-wa-ink/70 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
                                <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">NG</div>
                                <div className="wa-nums mt-2 text-2xl font-semibold text-red-400">{drawerRank.ng}</div>
                            </div>
                            <div className="rounded-xl border border-wa-accent/15 bg-wa-ink/70 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
                                <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">成約率</div>
                                <div className="wa-nums mt-2 text-2xl font-semibold text-wa-accent">
                                    {drawerRank.rate.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                        <Link
                            href={route('sales.records')}
                            className="inline-flex rounded-xl border border-wa-accent/30 px-5 py-2.5 text-xs font-semibold text-wa-accent transition hover:border-wa-accent/45 hover:bg-wa-accent/10"
                        >
                            案件一覧で詳細を見る
                        </Link>
                    </div>
                ) : null}
            </DetailDrawer>
        </AuthenticatedLayout>
    );
}
