import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import NeonCard from '@/Components/NeonCard';
import ActionButton from '@/Components/ActionButton';
import StatusBadge from '@/Components/StatusBadge';

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
            <div className="mx-auto max-w-6xl px-6 py-6 text-stone-800">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard>
                        <div className="text-xs font-bold tracking-widest text-stone-500">SEARCH</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-stone-900">検索 / 絞り込み</div>
                        <div className="mt-4 space-y-3">
                            <input type="text" placeholder="商材名で検索" className="nordic-field" />
                            <select className="nordic-field">
                                <option>カテゴリ：すべて</option>
                                <option>回線</option>
                                <option>モバイル</option>
                                <option>オプション</option>
                            </select>
                            <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                                <input type="checkbox" className="h-4 w-4 rounded border-stone-300 text-emerald-600" defaultChecked />
                                有効な商材のみ
                            </label>
                            <ActionButton className="w-full">検索</ActionButton>
                        </div>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2 overflow-x-auto" elevate={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-stone-500">CATALOG</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-stone-900">商材一覧</div>
                            </div>
                            <div className="text-xs font-semibold text-emerald-700">{list.length} 件</div>
                        </div>

                        <table className="mt-4 w-full border-collapse">
                            <thead>
                                <tr className="text-left text-xs text-stone-500">
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">NAME</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">CATEGORY</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">PRICE</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">STATE</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">UPDATED</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((p) => (
                                    <tr key={p.id} className="text-sm transition-colors hover:bg-white/70">
                                        <td className="border-b border-stone-200 px-3 py-3 font-black tracking-tight text-stone-900">
                                            <Link
                                                href={route('products.show', { id: p.id })}
                                                className="block text-emerald-800 transition-all duration-200 hover:text-emerald-600"
                                            >
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td className="border-b border-stone-200 px-3 py-3 text-stone-600">{p.category}</td>
                                        <td className="border-b border-stone-200 px-3 py-3 font-semibold text-stone-800">
                                            {p.price === 0 ? '無料' : `¥${p.price.toLocaleString()}`}
                                        </td>
                                        <td className="border-b border-stone-200 px-3 py-3">
                                            <StatusBadge variant={p.is_active ? 'success' : 'muted'}>
                                                {p.is_active ? '有効' : '停止'}
                                            </StatusBadge>
                                        </td>
                                        <td className="border-b border-stone-200 px-3 py-3 text-stone-500">{p.updated_at}</td>
                                        <td className="border-b border-stone-200 px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('products.show', { id: p.id })}
                                                    className="rounded-xl border border-stone-200 bg-white/90 px-4 py-2 text-xs font-black tracking-tight text-stone-700 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50/50"
                                                >
                                                    詳細
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </NeonCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
