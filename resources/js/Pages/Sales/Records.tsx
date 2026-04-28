import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type RecordItem = {
    id: number;
    staff_name: string;
    status: 'ok' | 'ng';
    date: string; // YYYY-MM-DD
};

export default function Records() {
    const [keyword, setKeyword] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const [page, setPage] = useState<number>(1);
    const [items, setItems] = useState<RecordItem[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [lastPage, setLastPage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const qs = useMemo(() => {
        const p = new URLSearchParams();
        p.set('page', String(page));
        if (keyword.trim()) p.set('keyword', keyword.trim());
        if (status) p.set('status', status);
        if (dateFrom) p.set('date_from', dateFrom);
        if (dateTo) p.set('date_to', dateTo);
        return p.toString();
    }, [page, keyword, status, dateFrom, dateTo]);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setErrorMessage(null);

        fetch(`${route('portal.api.sales.records')}?${qs}`, {
            headers: { Accept: 'application/json' },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = (await res.json()) as any;
                if (!mounted) return;
                setItems(Array.isArray(json?.data) ? (json.data as RecordItem[]) : []);
                setTotal(Number(json?.total ?? 0));
                setLastPage(Number(json?.last_page ?? 1));
            })
            .catch(() => {
                if (mounted) setErrorMessage('取得に失敗しました。条件を変えて再試行してください。');
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [qs]);

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">SALES / RECORDS</h2>}>
            <Head title="案件一覧" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-xs font-bold tracking-widest text-white/60">LIST</div>
                        <div className="mt-1 text-lg font-black tracking-tight text-white">案件データ一覧</div>
                    </div>
                    <Link
                        href={route('sales.summary')}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/80 hover:bg-white/10"
                    >
                        KPIへ戻る
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">FILTER</div>
                        <div className="mt-3 space-y-3">
                            <input
                                value={keyword}
                                onChange={(e) => {
                                    setPage(1);
                                    setKeyword(e.target.value);
                                }}
                                placeholder="担当者名で検索"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                            />
                            <select
                                value={status}
                                onChange={(e) => {
                                    setPage(1);
                                    setStatus(e.target.value);
                                }}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                            >
                                <option value="">ステータス（全て）</option>
                                <option value="ok">OK</option>
                                <option value="ng">NG</option>
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setPage(1);
                                        setDateFrom(e.target.value);
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                                />
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setPage(1);
                                        setDateTo(e.target.value);
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setKeyword('');
                                    setStatus('');
                                    setDateFrom('');
                                    setDateTo('');
                                    setPage(1);
                                }}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black tracking-widest text-white/75 hover:bg-white/10"
                            >
                                RESET
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-xs font-semibold text-white/55">TOTAL {total.toLocaleString()}</div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-widest text-white/80 hover:bg-white/10 disabled:opacity-40"
                                >
                                    PREV
                                </button>
                                <div className="text-xs text-white/55">
                                    {page} / {lastPage}
                                </div>
                                <button
                                    type="button"
                                    disabled={page >= lastPage}
                                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-widest text-white/80 hover:bg-white/10 disabled:opacity-40"
                                >
                                    NEXT
                                </button>
                            </div>
                        </div>

                        {errorMessage ? (
                            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100/80">
                                {errorMessage}
                            </div>
                        ) : null}

                        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-xs font-bold tracking-widest text-white/55">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">担当者</th>
                                        <th className="px-4 py-3">STATUS</th>
                                        <th className="px-4 py-3">DATE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10 bg-[#0b1020]/35">
                                    {isLoading ? (
                                        <tr>
                                            <td className="px-4 py-6 text-sm text-white/40" colSpan={4}>
                                                読み込み中…
                                            </td>
                                        </tr>
                                    ) : items.length ? (
                                        items.map((r) => (
                                            <tr key={r.id} className="hover:bg-white/5">
                                                <td className="px-4 py-3 font-mono text-xs text-white/70">{r.id}</td>
                                                <td className="px-4 py-3 font-semibold text-white">{r.staff_name}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={
                                                            'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black tracking-widest ring-1 ring-inset ' +
                                                            (r.status === 'ok'
                                                                ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/25'
                                                                : 'bg-rose-400/10 text-rose-200 ring-rose-400/25')
                                                        }
                                                    >
                                                        {r.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-white/55">{r.date}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="px-4 py-6 text-sm text-white/40" colSpan={4}>
                                                データがありません
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

