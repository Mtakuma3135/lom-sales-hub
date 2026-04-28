import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({ title }: { title?: string }) {
    const pageTitle = title ?? 'ホーム';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-black tracking-tight">HOME / DASH</span>
                </div>
            }
        >
            <Head title={pageTitle} />

            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                    {/* Welcome */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                    <div className="pointer-events-none absolute -inset-24 bg-gradient-to-br from-purple-500/25 to-cyan-400/15 blur-3xl" />
                    <div className="relative">
                        <div className="text-xs font-bold tracking-widest text-white/60">
                            WELCOME
                        </div>
                        <div className="mt-2 text-xl font-black tracking-tight text-white">
                            ようこそ、山田太郎さん
                        </div>
                        <div className="mt-1 text-sm text-white/60">
                            本日も頑張りましょう！
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Notices */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">NOTICE</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">新着周知事項</div>
                            </div>
                            <span className="text-xs font-semibold text-cyan-200/80">
                                LATEST 3
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {[
                                {
                                    title: '新商材「光回線プラン」のトークスクリプト公開',
                                    date: '2026-04-20 10:00',
                                    accent: 'from-purple-500/20 to-cyan-400/15',
                                },
                                {
                                    title: '4月度の営業目標について',
                                    date: '2026-04-18 14:30',
                                    accent: 'from-white/10 to-white/5',
                                },
                                {
                                    title: 'システムメンテナンスのお知らせ',
                                    date: '2026-04-16 09:00',
                                    accent: 'from-white/10 to-white/5',
                                },
                            ].map((n) => (
                                <div
                                    key={n.title}
                                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/55 px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_0_1px_rgba(34,211,238,0.20),0_0_26px_rgba(168,85,247,0.14)]"
                                >
                                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-400/10" />
                                    <div className="relative flex items-start gap-3">
                                        <div className={'mt-1 h-10 w-1 rounded-full bg-gradient-to-b ' + n.accent} />
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-black tracking-tight text-white">
                                                {n.title}
                                            </div>
                                            <div className="mt-1 text-xs text-white/45">
                                                {n.date}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* KPI */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">KPI</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">今月</div>
                            </div>
                            <span className="text-xs font-semibold text-cyan-200/80">FLASH</span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {[
                                {
                                    label: '契約率',
                                    value: '68.5%',
                                    sub: '前月比 +5.2%',
                                    grad: 'from-purple-500/20 to-cyan-400/15',
                                    color: 'text-white',
                                },
                                {
                                    label: 'OK数',
                                    value: '137',
                                    sub: '今月の合計',
                                    grad: 'from-emerald-500/15 to-cyan-400/10',
                                    color: 'text-emerald-200',
                                },
                                {
                                    label: 'NG数',
                                    value: '63',
                                    sub: '今月の合計',
                                    grad: 'from-rose-500/15 to-purple-500/10',
                                    color: 'text-rose-200',
                                },
                            ].map((k) => (
                                <div
                                    key={k.label}
                                    className={
                                        'relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/55 px-3 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]'
                                    }
                                >
                                    <div className={'pointer-events-none absolute -inset-16 bg-gradient-to-br blur-3xl ' + k.grad} />
                                    <div className="relative text-[11px] font-bold tracking-widest text-white/55">
                                        {k.label}
                                    </div>
                                    <div className={'relative mt-1 text-xl font-black tracking-tighter ' + k.color}>
                                        {k.value}
                                    </div>
                                    <div className="relative mt-1 text-[11px] text-white/40">
                                        {k.sub}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                    {/* Lunch schedule */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-white/60">LUNCH</div>
                            <div className="mt-1 text-lg font-black tracking-tight text-white">本日の昼休憩予定</div>
                        </div>
                        <span className="text-xs font-semibold text-cyan-200/80">MOCK</span>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead>
                                <tr className="text-left text-xs text-white/60">
                                        <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">
                                            時間
                                        </th>
                                        <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">
                                            担当者
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { time: '12:00 - 13:00', name: '山田太郎' },
                                        { time: '12:30 - 13:30', name: '佐藤花子' },
                                        { time: '13:00 - 14:00', name: '鈴木一郎' },
                                    ].map((r) => (
                                    <tr key={r.time} className="text-sm hover:bg-white/5 transition-colors">
                                            <td className="border-b border-white/10 px-3 py-3 text-white/85 font-semibold">
                                                {r.time}
                                            </td>
                                            <td className="border-b border-white/10 px-3 py-3">
                                                <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs font-black tracking-tight text-white/80 ring-1 ring-inset ring-white/10">
                                                    {r.name}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick links */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">QUICK LINKS</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-white">よく使うリンク</div>
                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                            {[
                                { title: 'KING OF TIME', sub: '勤怠管理' },
                                { title: 'Google Chat', sub: 'チャット' },
                                { title: '商材資料', sub: 'Drive' },
                                { title: '営業マニュアル', sub: 'ドキュメント' },
                            ].map((l) => (
                                <button
                                    key={l.title}
                                    type="button"
                                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/55 px-4 py-4 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_0_1px_rgba(34,211,238,0.20),0_0_26px_rgba(168,85,247,0.14)]"
                                >
                                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-400/10" />
                                    <div className="relative text-sm font-black tracking-tight text-white">
                                        {l.title}
                                    </div>
                                    <div className="relative mt-1 text-xs text-white/45">
                                        {l.sub}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
            </div>
        </AuthenticatedLayout>
    );
}