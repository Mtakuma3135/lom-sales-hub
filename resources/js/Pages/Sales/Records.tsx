import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import NeonCard from '@/Components/NeonCard';
import { nextDir, type SortDir, SortableTh } from '@/Components/SortableTh';

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
    const [sort, setSort] = useState<string>(() => initialParams.get('sort') ?? 'date');
    const [dir, setDir] = useState<SortDir>(() => ((initialParams.get('dir') ?? 'desc') === 'asc' ? 'asc' : 'desc'));
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
        if (sort) p.set('sort', sort);
        if (dir) p.set('dir', dir);
        return p.toString();
    }, [page, keyword, status, dateFrom, dateTo, sort, dir]);

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
        'rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/40 disabled:opacity-40';

    const toggleSort = (key: string) => {
        setPage(1);
        if (sort !== key) {
            setSort(key);
            setDir('asc');
            return;
        }
        setDir((d) => nextDir(d));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">SALES / RECORDS</h2>}>
            <Head title="案件一覧" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-wa-body wa-body-track">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="text-xs font-bold tracking-widest text-wa-muted">LIST</div>
                        <div className="mt-2 text-lg font-black tracking-tight text-wa-body">案件データ一覧</div>
                    </div>
                    <Link
                        href={route('sales.summary')}
                        className="rounded-sm border border-wa-accent/30 px-4 py-2 text-xs font-black tracking-widest text-wa-accent transition hover:border-wa-accent/45 hover:bg-wa-accent/10"
                    >
                        KPI・案件へ戻る
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-9 lg:grid-cols-3">
                    <NeonCard elevate={false}>
                        <div className="text-xs font-bold tracking-widest text-wa-muted">FILTER</div>
                        <div className="mt-4 space-y-4">
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
                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-wa-muted">開始</div>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => {
                                            setPage(1);
                                            setDateFrom(e.target.value);
                                        }}
                                        className="nordic-field box-border min-h-11 min-w-0 w-full py-2.5 text-sm"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-wa-muted">終了</div>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => {
                                            setPage(1);
                                            setDateTo(e.target.value);
                                        }}
                                        className="nordic-field box-border min-h-11 min-w-0 w-full py-2.5 text-sm"
                                    />
                                </div>
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
                                className="w-full rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-3 text-xs font-black tracking-widest text-wa-muted transition hover:border-wa-accent/40 hover:text-wa-body"
                            >
                                RESET
                            </button>
                        </div>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2" elevate={false}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-xs font-semibold text-wa-muted">TOTAL {total.toLocaleString()}</div>
                            <div className="flex items-center gap-2">
                                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={pageBtn}>
                                    PREV
                                </button>
                                <div className="text-xs text-wa-muted">
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
                            <div className="mt-4 rounded-sm border border-red-500/35 bg-red-950/40 px-4 py-3 text-xs text-red-300">
                                {errorMessage}
                            </div>
                        ) : null}

                        <div className="mt-4 overflow-hidden rounded-sm border border-wa-accent/20">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-wa-ink text-xs font-bold tracking-widest text-wa-muted">
                                    <tr>
                                        <SortableTh
                                            label="ID"
                                            active={sort === 'id'}
                                            dir={dir}
                                            onToggle={() => toggleSort('id')}
                                            className="px-4 py-3"
                                        />
                                        <SortableTh
                                            label="担当者"
                                            active={sort === 'staff_name'}
                                            dir={dir}
                                            onToggle={() => toggleSort('staff_name')}
                                            className="px-4 py-3"
                                        />
                                        <SortableTh
                                            label="STATUS"
                                            active={sort === 'status'}
                                            dir={dir}
                                            onToggle={() => toggleSort('status')}
                                            className="px-4 py-3"
                                        />
                                        <SortableTh
                                            label="DATE"
                                            active={sort === 'date'}
                                            dir={dir}
                                            onToggle={() => toggleSort('date')}
                                            className="px-4 py-3"
                                        />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-wa-accent/15 bg-wa-card/50">
                                    {isLoading ? (
                                        <tr>
                                            <td className="px-4 py-6 text-sm text-wa-muted" colSpan={4}>
                                                読み込み中…
                                            </td>
                                        </tr>
                                    ) : items.length ? (
                                        items.map((r) => (
                                            <tr key={r.id} className="transition-colors hover:bg-wa-ink/80">
                                                <td className="px-4 py-3 font-mono text-xs text-wa-muted">{r.id}</td>
                                                <td className="px-4 py-3 font-semibold text-wa-body">{r.staff_name}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={
                                                            'inline-flex items-center rounded-sm border px-2.5 py-1 text-[11px] font-black tracking-widest ' +
                                                            (r.status === 'ok'
                                                                ? 'border-teal-500/35 bg-wa-ink text-teal-300'
                                                                : 'border-red-500/35 bg-wa-ink text-red-400')
                                                        }
                                                    >
                                                        {r.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-wa-muted">{r.date}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="px-4 py-6 text-sm text-wa-muted" colSpan={4}>
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
