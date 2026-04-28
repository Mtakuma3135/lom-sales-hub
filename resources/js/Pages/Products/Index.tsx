import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

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

export default function Index({ products }: { products?: ProductsProp }) {
    const list =
        products?.data ??
        [
            {
                id: 201,
                name: '光回線プランA',
                category: '回線',
                price: 3980,
                is_active: true,
                updated_at: '2026-04-20 10:00',
            },
            {
                id: 202,
                name: 'モバイルWi-Fi（法人）',
                category: 'モバイル',
                price: 5480,
                is_active: true,
                updated_at: '2026-04-18 15:15',
            },
            {
                id: 203,
                name: 'でんきセット割',
                category: 'オプション',
                price: 0,
                is_active: false,
                updated_at: '2026-04-10 09:30',
            },
        ];

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">PRODUCTS / CATALOG</h2>}>
            <Head title="商材一覧" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* 左：検索・絞り込み */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">SEARCH</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-white">検索 / 絞り込み</div>
                        <div className="mt-4 space-y-3">
                            <input
                                type="text"
                                placeholder="商材名で検索"
                                className="w-full rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                            />
                            <select className="w-full rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30">
                                <option>カテゴリ：すべて</option>
                                <option>回線</option>
                                <option>モバイル</option>
                                <option>オプション</option>
                            </select>
                            <label className="flex items-center gap-2 text-sm font-semibold text-white/75">
                                <input type="checkbox" className="h-4 w-4" defaultChecked />
                                有効な商材のみ
                            </label>
                            <button
                                type="button"
                                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-3 py-3 text-sm font-black tracking-tight text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110"
                            >
                                検索
                            </button>
                        </div>
                    </div>

                    {/* 右：一覧テーブル */}
                    <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">CATALOG</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">商材一覧</div>
                            </div>
                            <div className="text-xs font-semibold text-cyan-200/80">{list.length} 件</div>
                        </div>

                        <table className="mt-4 w-full border-collapse">
                            <thead>
                                <tr className="text-left text-xs text-white/60">
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">NAME</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">CATEGORY</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">PRICE</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">STATE</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">UPDATED</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((p) => (
                                    <tr key={p.id} className="text-sm hover:bg-white/5 transition-colors">
                                        <td className="border-b border-white/10 px-3 py-3 font-black tracking-tight text-white">
                                            {p.name}
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3 text-white/70">
                                            {p.category}
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3 text-white/85 font-semibold">
                                            {p.price === 0 ? '無料' : `¥${p.price.toLocaleString()}`}
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3">
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (p.is_active
                                                        ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/25'
                                                        : 'bg-white/5 text-white/70 ring-1 ring-inset ring-white/10')
                                                }
                                            >
                                                {p.is_active ? '有効' : '停止'}
                                            </span>
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3 text-white/55">
                                            {p.updated_at}
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('products.show', { id: p.id })}
                                                    className="rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                                >
                                                    詳細
                                                </Link>
                                                <Link
                                                    href={route('products.show', { id: p.id })}
                                                    className="rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                                >
                                                    編集
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

