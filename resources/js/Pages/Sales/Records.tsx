import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import NeonCard from '@/Components/NeonCard';

type RecordItem = {
    id: number;
    staff_name: string;
    status: 'ok' | 'ng';
    date: string; // YYYY-MM-DD
};

export default function Records() {
    const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [keyword, setKeyword] = useState<string>(() => initialParams.get('keyword') ?? '');
    const [status, setStatus] = useState<string>(() => initialParams.get('status') ?? '');
    const [dateFrom, setDateFrom] = useState<string>(() => initialParams.get('date_from') ?? '');
    const [dateTo, setDateTo] = useState<string>(() => initialParams.get('date_to') ?? '');

    const [page, setPage] = useState<number>(() => {
        const v = Number(initialParams.get('page') ?? 1);
        return Number.isFinite(v) && v >= 1 ? v : 1;
    });
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

    const pageBtn =
        'rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-xs font-black tracking-widest text-stone-700 shadow-sm transition hover:bg-emerald-50/50 disabled:opacity-40';

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">SALES / RECORDS</h2>}>
            <Head title="案件一覧" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-stone-800">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-xs font-bold tracking-widest text-stone-500">LIST</div>
                        <div className="mt-1 text-lg font-black tracking-tight text-stone-900">案件データ一覧</div>
                    </div>
                    <Link
                        href={route('sales.summary')}
                        className="rounded-xl border border-stone-200 bg-white/90 px-4 py-2 text-xs font-black tracking-widest text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
                    >
                        KPIへ戻る
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard elevate={false}>
                        <div className="text-xs font-bold tracking-widest text-stone-500">FILTER</div>
                        <div className="mt-3 space-y-3">
                            <input
                                value={keyword}
                                onChange={(e) => {
                                    setPage(1);
                                    setKeyword(e.target.value);
                                }}
                                placeholder="担当者名で検索"
                                className="nordic-field"
                            />
                            <select
                                value={status}
                                onChange={(e) => {
                                    setPage(1);
                                    setStatus(e.target.value);
                                }}
                                className="nordic-field"
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
                                    className="nordic-field"
                                />
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setPage(1);
                                        setDateTo(e.target.value);
                                    }}
                                    className="nordic-field"
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
                                className="w-full rounded-xl border border-stone-200 bg-white/90 px-4 py-3 text-xs font-black tracking-widest text-stone-600 shadow-sm transition hover:bg-stone-50"
                            >
                                RESET
                            </button>
                        </div>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2" elevate={false}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-xs font-semibold text-stone-600">TOTAL {total.toLocaleString()}</div>
                            <div className="flex items-center gap-2">
                                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={pageBtn}>
                                    PREV
                                </button>
                                <div className="text-xs text-stone-500">
                                    {page} / {lastPage}
                                </div>
                                <button
                                    type="button"
                                    disabled={page >= lastPage}
                                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                    className={pageBtn}
                                >
                                    NEXT
                                </button>
                            </div>
                        </div>

                        {errorMessage ? (
                            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                                {errorMessage}
                            </div>
                        ) : null}

                        <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-100/80 text-xs font-bold tracking-widest text-stone-600">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">担当者</th>
                                        <th className="px-4 py-3">STATUS</th>
                                        <th className="px-4 py-3">DATE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 bg-white/60">
                                    {isLoading ? (
                                        <tr>
                                            <td className="px-4 py-6 text-sm text-stone-500" colSpan={4}>
                                                読み込み中…
                                            </td>
                                        </tr>
                                    ) : items.length ? (
                                        items.map((r) => (
                                            <tr key={r.id} className="hover:bg-emerald-50/30">
                                                <td className="px-4 py-3 font-mono text-xs text-stone-600">{r.id}</td>
                                                <td className="px-4 py-3 font-semibold text-stone-900">{r.staff_name}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={
                                                            'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black tracking-widest ring-1 ring-inset ' +
                                                            (r.status === 'ok'
                                                                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                                                                : 'bg-rose-50 text-rose-800 ring-rose-200')
                                                        }
                                                    >
                                                        {r.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-stone-600">{r.date}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="px-4 py-6 text-sm text-stone-500" colSpan={4}>
                                                データがありません
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </NeonCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
