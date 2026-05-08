import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import NeonCard from '@/Components/NeonCard';
import ActionButton from '@/Components/ActionButton';
import StatusBadge from '@/Components/StatusBadge';
import { nextDir, type SortDir, SortableTh } from '@/Components/SortableTh';

type Product = {
    id: number;
    name: string;
    category: string;
    price: number;
    is_active: boolean;
    updated_at: string;
};

type ProductsProp = {
    data: Product[];
};

type Filters = {
    q: string;
    category: string;
    active_only: boolean;
    sort?: string;
    dir?: SortDir | string;
};

export default function Index({
    products,
    filters,
    categoryOptions,
}: {
    products?: ProductsProp;
    filters?: Filters;
    categoryOptions?: string[];
}) {
    const list = products?.data ?? [];

    const initialFilters = useMemo(
        () =>
            filters ?? {
                q: '',
                category: '',
                active_only: true,
            },
        [filters],
    );

    const [q, setQ] = useState(initialFilters.q);
    const [category, setCategory] = useState(initialFilters.category);
    const [activeOnly, setActiveOnly] = useState(initialFilters.active_only);
    const [sort, setSort] = useState<string>(() => initialFilters.sort ?? 'updated_at');
    const [dir, setDir] = useState<SortDir>(() => ((initialFilters.dir ?? 'desc') === 'asc' ? 'asc' : 'desc'));
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        setQ(initialFilters.q);
        setCategory(initialFilters.category);
        setActiveOnly(initialFilters.active_only);
        setSort(initialFilters.sort ?? 'updated_at');
        setDir(((initialFilters.dir ?? 'desc') === 'asc' ? 'asc' : 'desc') as SortDir);
    }, [initialFilters]);

    const cats = categoryOptions ?? [];

    const runSearch = (params: { q: string; category: string; activeOnly: boolean; sort: string; dir: SortDir }) => {
        setSearching(true);
        router.get(
            route('products.index'),
            {
                q: params.q.trim() || undefined,
                category: params.category.trim() || undefined,
                active_only: params.activeOnly ? '1' : '0',
                sort: params.sort || undefined,
                dir: params.dir,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setSearching(false),
            },
        );
    };

    const applySearch = () => runSearch({ q, category, activeOnly, sort, dir });

    const toggleSort = (key: string) => {
        const nextSort = sort !== key ? key : sort;
        const nextDirVal: SortDir = sort !== key ? 'asc' : nextDir(dir);

        setSort(nextSort);
        setDir(nextDirVal);
        runSearch({ q, category, activeOnly, sort: nextSort, dir: nextDirVal });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">PRODUCTS / CATALOG</h2>}>
            <Head title="商材一覧" />
            <div className="mx-auto min-w-0 max-w-6xl px-4 py-6 text-wa-body wa-body-track sm:px-6">
                <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    <NeonCard className="min-w-0">
                        <div className="text-xs font-bold tracking-widest text-wa-muted">SEARCH</div>
                        <div className="mt-3 text-sm font-black tracking-tight text-wa-body">検索 / 絞り込み</div>
                        <div className="mt-6 min-w-0 space-y-4">
                            <input
                                type="text"
                                placeholder="商材名・カテゴリで検索"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="nordic-field min-w-0"
                            />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="nordic-field min-w-0"
                            >
                                <option value="">カテゴリ：すべて</option>
                                {cats.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            <label className="flex items-center gap-2 text-sm font-semibold text-wa-body">
                                <input
                                    type="checkbox"
                                    checked={activeOnly}
                                    onChange={(e) => setActiveOnly(e.target.checked)}
                                    className="h-4 w-4 shrink-0 rounded-sm border-wa-accent/35 text-wa-accent"
                                />
                                有効な商材のみ（管理者はオフで全件）
                            </label>
                            <ActionButton className="w-full" disabled={searching} onClick={() => applySearch()}>
                                {searching ? '検索中…' : '検索'}
                            </ActionButton>
                        </div>
                    </NeonCard>

                    <NeonCard className="min-w-0 lg:col-span-2" elevate={false}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-xs font-bold tracking-widest text-wa-muted">CATALOG</div>
                                <div className="mt-2 text-lg font-black tracking-tight text-wa-body">商材一覧</div>
                            </div>
                            <div className="shrink-0 text-xs font-semibold text-wa-accent">{list.length} 件</div>
                        </div>

                        <ul className="mt-6 space-y-3 lg:hidden">
                            {list.map((p) => (
                                <li
                                    key={p.id}
                                    className="rounded-xl border border-wa-accent/15 bg-wa-ink/70 p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <Link
                                            href={route('products.show', { id: p.id })}
                                            className="min-w-0 flex-1 break-words text-sm font-black tracking-tight text-wa-accent transition hover:text-wa-accent/80"
                                        >
                                            {p.name}
                                        </Link>
                                        <StatusBadge className="shrink-0" variant={p.is_active ? 'success' : 'muted'}>
                                            {p.is_active ? '有効' : '停止'}
                                        </StatusBadge>
                                    </div>
                                    <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                        <div className="flex min-w-0 gap-2">
                                            <dt className="shrink-0 text-wa-muted">カテゴリ</dt>
                                            <dd className="min-w-0 truncate text-wa-body" title={p.category}>
                                                {p.category}
                                            </dd>
                                        </div>
                                        <div className="flex min-w-0 gap-2">
                                            <dt className="shrink-0 text-wa-muted">料金</dt>
                                            <dd className="min-w-0 font-semibold text-wa-body">
                                                {p.price === 0 ? '無料' : `¥${p.price.toLocaleString()}`}
                                            </dd>
                                        </div>
                                        <div className="flex min-w-0 gap-2 sm:col-span-2">
                                            <dt className="shrink-0 text-wa-muted">更新</dt>
                                            <dd className="min-w-0 wa-wrap-anywhere text-wa-muted">{p.updated_at}</dd>
                                        </div>
                                    </dl>
                                    <div className="mt-4">
                                        <Link
                                            href={route('products.show', { id: p.id })}
                                            className="inline-flex rounded-xl border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                                        >
                                            詳細
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 hidden min-w-0 lg:block">
                            <table className="w-full table-fixed border-collapse text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-wa-muted">
                                        <SortableTh
                                            label="NAME"
                                            active={sort === 'name'}
                                            dir={dir}
                                            onToggle={() => toggleSort('name')}
                                            className="w-[32%] border-b border-wa-accent/20 py-2 pl-0 pr-2 font-bold tracking-widest"
                                        />
                                        <SortableTh
                                            label="CATEGORY"
                                            active={sort === 'category'}
                                            dir={dir}
                                            onToggle={() => toggleSort('category')}
                                            className="w-[16%] border-b border-wa-accent/20 px-2 py-2 font-bold tracking-widest"
                                        />
                                        <SortableTh
                                            label="PRICE"
                                            active={sort === 'price'}
                                            dir={dir}
                                            onToggle={() => toggleSort('price')}
                                            className="w-[12%] border-b border-wa-accent/20 px-2 py-2 font-bold tracking-widest"
                                        />
                                        <SortableTh
                                            label="STATE"
                                            active={sort === 'is_active'}
                                            dir={dir}
                                            onToggle={() => toggleSort('is_active')}
                                            className="w-[12%] border-b border-wa-accent/20 px-2 py-2 font-bold tracking-widest"
                                        />
                                        <SortableTh
                                            label="UPDATED"
                                            active={sort === 'updated_at'}
                                            dir={dir}
                                            onToggle={() => toggleSort('updated_at')}
                                            className="w-[18%] border-b border-wa-accent/20 px-2 py-2 font-bold tracking-widest"
                                        />
                                        <th className="w-[10%] border-b border-wa-accent/20 py-2 pl-2 pr-0 text-right font-bold tracking-widest">
                                            ACTIONS
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((p) => (
                                        <tr key={p.id} className="transition-colors hover:bg-wa-ink/80">
                                            <td className="max-w-0 border-b border-wa-accent/20 py-3 pl-0 pr-2 font-black tracking-tight text-wa-body">
                                                <Link
                                                    href={route('products.show', { id: p.id })}
                                                    className="block truncate text-wa-accent transition hover:text-wa-accent/80"
                                                    title={p.name}
                                                >
                                                    {p.name}
                                                </Link>
                                            </td>
                                            <td className="max-w-0 border-b border-wa-accent/20 px-2 py-3">
                                                <span className="block truncate text-wa-muted" title={p.category}>
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className="border-b border-wa-accent/20 px-2 py-3 font-semibold text-wa-body">
                                                {p.price === 0 ? '無料' : `¥${p.price.toLocaleString()}`}
                                            </td>
                                            <td className="border-b border-wa-accent/20 px-2 py-3">
                                                <StatusBadge variant={p.is_active ? 'success' : 'muted'}>
                                                    {p.is_active ? '有効' : '停止'}
                                                </StatusBadge>
                                            </td>
                                            <td className="max-w-0 border-b border-wa-accent/20 px-2 py-3 text-xs text-wa-muted">
                                                <span className="block truncate" title={p.updated_at}>
                                                    {p.updated_at}
                                                </span>
                                            </td>
                                            <td className="border-b border-wa-accent/20 py-3 pl-2 pr-0 text-right">
                                                <Link
                                                    href={route('products.show', { id: p.id })}
                                                    className="inline-block rounded-xl border border-wa-accent/25 bg-wa-ink px-3 py-1.5 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                                                >
                                                    詳細
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {list.length === 0 ? (
                            <div className="mt-6 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-8 text-center text-sm text-wa-muted">
                                条件に一致する商材がありません
                            </div>
                        ) : null}
                    </NeonCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
