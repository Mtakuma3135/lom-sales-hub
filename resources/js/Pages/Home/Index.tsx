import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardTileLink from '@/Components/DashboardTileLink';
import NeonCard from '@/Components/NeonCard';
import SlotNumber from '@/Components/UI/SlotNumber';
import NoticeFeedItem from '@/Components/NoticeFeedItem';
import { PageProps } from '@/types';
import { useEffect, useMemo, useState } from 'react';

export default function Index({ title }: { title?: string }) {
    const pageTitle = title ?? 'ホーム';
    const { props } = usePage<PageProps>();
    const userId = props.auth?.user?.id ?? null;

    const go = (href: string) => router.visit(href, { preserveScroll: true });
    const onCardKeyDown =
        (href: string) => (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            go(href);
        };

    // 昼休憩タイマー（localStorage）: 当日の自分のタイマーを拾って表示（リアルタイム更新）
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const totalMs = 60 * 60 * 1000;
    const [timerState, setTimerState] = useState<{ startedAt: number; startTime: string } | null>(null);
    const [nowMs, setNowMs] = useState<number>(() => Date.now());

    useEffect(() => {
        if (!userId) return;
        const read = () => {
            const prefix = `lunchBreakTimer:${today}:`;
            const suffix = `:${userId}`;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k) continue;
                if (!k.startsWith(prefix) || !k.endsWith(suffix)) continue;
                const startedAt = Number(localStorage.getItem(k) ?? '');
                const startTime = k.slice(prefix.length, k.length - suffix.length);
                if (!Number.isFinite(startedAt)) continue;
                return { startedAt, startTime };
            }
            return null;
        };

        setTimerState(read());
        setNowMs(Date.now());

        const tick = window.setInterval(() => {
            setNowMs(Date.now());
            setTimerState(read());
        }, 500);

        const onStorage = (e: StorageEvent) => {
            if (!e.key) return;
            if (!e.key.startsWith(`lunchBreakTimer:${today}:`)) return;
            setTimerState(read());
        };
        window.addEventListener('storage', onStorage);

        return () => {
            window.clearInterval(tick);
            window.removeEventListener('storage', onStorage);
        };
    }, [today, userId]);

    const elapsedMs = timerState ? Math.max(0, nowMs - timerState.startedAt) : 0;
    const remainingMs = timerState ? Math.max(0, totalMs - elapsedMs) : totalMs;
    const pct = timerState ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
    const fmt = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-tight text-stone-800">ホーム</span>
                </div>
            }
        >
            <Head title={pageTitle} />

            <div className="mx-auto max-w-6xl space-y-10 text-stone-700">
                <NeonCard
                    elevate
                    role="button"
                    tabIndex={0}
                    onClick={() => go(route('mypage.index'))}
                    onKeyDown={onCardKeyDown(route('mypage.index'))}
                    className="p-8 cursor-pointer"
                >
                    <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">ようこそ</div>
                    <div className="mt-3 text-2xl font-semibold tracking-tight text-stone-800">山田太郎さん</div>
                    <p className="mt-2 text-sm leading-relaxed text-stone-500">本日も無理のないペースで進めましょう。</p>
                </NeonCard>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
                    <NeonCard
                        elevate
                        role="button"
                        tabIndex={0}
                        onClick={() => go(route('notices.index'))}
                        onKeyDown={onCardKeyDown(route('notices.index'))}
                        className="p-8 lg:col-span-2 cursor-pointer"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">周知</div>
                                <div className="mt-2 text-lg font-semibold tracking-tight text-stone-800">新着のお知らせ</div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                                最新 3 件
                            </span>
                        </div>

                        <div className="mt-8 space-y-4">
                            {[
                                {
                                    id: 2,
                                    title: '新商材「光回線プラン」のトークスクリプト公開',
                                    date: '2026-04-20 10:00',
                                },
                                {
                                    id: 1,
                                    title: '4月度の営業目標について',
                                    date: '2026-04-18 14:30',
                                },
                                {
                                    id: 3,
                                    title: 'システムメンテナンスのお知らせ',
                                    date: '2026-04-16 09:00',
                                },
                            ].map((n) => (
                                <div key={n.id} onClick={(e) => e.stopPropagation()}>
                                    <NoticeFeedItem
                                        title={n.title}
                                        publishedAt={n.date}
                                        isPinned={n.id === 1}
                                        onOpen={() => go(`${route('notices.index')}?open=${n.id}`)}
                                    />
                                </div>
                            ))}
                        </div>
                    </NeonCard>

                    <NeonCard
                        elevate
                        role="button"
                        tabIndex={0}
                        onClick={() => go(route('sales.summary'))}
                        onKeyDown={onCardKeyDown(route('sales.summary'))}
                        className="p-8 cursor-pointer"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">KPI</div>
                                <div className="mt-2 text-lg font-semibold tracking-tight text-stone-800">今月</div>
                            </div>
                            <span className="text-xs font-medium text-stone-400">MOCK</span>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-4">
                            {[
                                { label: '契約率', value: '68.5', suffix: '%', sub: '前月比 +5.2%', valClass: 'text-stone-800', href: `${route('sales.summary')}?tab=summary` },
                                { label: 'OK', value: '137', suffix: '', sub: '今月合計', valClass: 'text-emerald-700', href: `${route('sales.records')}?status=ok` },
                                { label: 'NG', value: '63', suffix: '', sub: '今月合計', valClass: 'text-red-700', href: `${route('sales.records')}?status=ng` },
                            ].map((k) => (
                                <div
                                    key={k.label}
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        go(k.href);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key !== 'Enter' && e.key !== ' ') return;
                                        e.preventDefault();
                                        e.stopPropagation();
                                        go(k.href);
                                    }}
                                    className="rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-4 transition hover:border-emerald-200 hover:bg-white"
                                >
                                    <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                        {k.label}
                                    </div>
                                    <div className={`mt-1 text-2xl font-semibold tabular-nums ${k.valClass}`}>
                                        <SlotNumber value={k.value} />
                                        {k.suffix}
                                    </div>
                                    <div className="mt-1 text-xs text-stone-500">{k.sub}</div>
                                </div>
                            ))}
                        </div>
                    </NeonCard>
                </div>

                <NeonCard
                    elevate
                    role="button"
                    tabIndex={0}
                    onClick={() => go(route('lunch-breaks.index'))}
                    onKeyDown={onCardKeyDown(route('lunch-breaks.index'))}
                    className="p-8 cursor-pointer"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">昼休憩</div>
                            <div className="mt-2 text-lg font-semibold tracking-tight text-stone-800">本日の予定</div>
                        </div>
                        <span className="text-xs font-medium text-stone-400">MOCK</span>
                    </div>

                    <div className="mt-6 rounded-xl border border-stone-100 bg-stone-50/80 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                                60分タイマー（人が走る）
                            </div>
                            <div className="text-xs font-semibold text-stone-600">
                                {timerState ? `残り ${fmt(remainingMs)}` : '未開始'}
                            </div>
                        </div>
                        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-stone-200">
                            <div
                                className="h-full bg-emerald-500 transition-[width] duration-500 ease-out"
                                style={{ width: `${timerState ? pct : 0}%` }}
                            />
                        </div>
                        <div className="relative mt-3 h-6">
                            <div
                                className="absolute top-0 -translate-x-1/2 text-emerald-700 drop-shadow-[0_0_10px_rgba(16,185,129,0.35)] transition-[left] duration-500 ease-out"
                                style={{ left: `${timerState ? pct : 0}%` }}
                                aria-hidden
                            >
                                🏃
                            </div>
                            <div className="text-[11px] text-stone-500">
                                {timerState ? `開始: ${timerState.startTime}` : '昼休憩ページで開始するとここでも表示されます'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0 text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                                    <th className="border-b border-stone-200 px-4 py-3">時間</th>
                                    <th className="border-b border-stone-200 px-4 py-3">休憩者</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { time: '12:00 - 13:00', name: '山田太郎' },
                                    { time: '13:00 - 14:00', name: '佐藤花子' },
                                ].map((r) => (
                                    <tr key={r.time} className="transition-colors hover:bg-stone-50">
                                        <td className="border-b border-stone-100 px-4 py-4 font-medium text-stone-800">
                                            {r.time}
                                        </td>
                                        <td className="border-b border-stone-100 px-4 py-4">
                                            <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-200/80">
                                                {r.name}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </NeonCard>

                <NeonCard elevate={false} className="p-8">
                    <div className="text-xs font-semibold uppercase tracking-widest text-stone-400">ショートカット</div>
                    <div className="mt-2 text-sm font-semibold text-stone-800">よく使う画面</div>
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <DashboardTileLink
                            title="社内情報"
                            description="周知事項・お知らせ"
                            href={route('notices.index')}
                            badge={{ label: 'NOTICE', variant: 'primary', pulse: true }}
                        />
                        <DashboardTileLink
                            title="各商材について"
                            description="商品一覧・トークの要点"
                            href={route('products.index')}
                            badge={{ label: 'DOC', variant: 'muted' }}
                        />
                        <DashboardTileLink
                            title="タスク管理"
                            description="依頼・進捗・期限"
                            href={route('task-requests.index')}
                            badge={{ label: 'TASK', variant: 'success' }}
                        />
                        <DashboardTileLink
                            title="マイページ"
                            description="打刻・昼休憩・設定"
                            href={route('mypage.index')}
                            badge={{ label: 'ME', variant: 'primary' }}
                        />
                    </div>
                </NeonCard>
            </div>
        </AuthenticatedLayout>
    );
}
