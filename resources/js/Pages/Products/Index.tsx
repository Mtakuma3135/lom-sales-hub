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
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">PRODUCTS / CATALOG</h2>}>
            <Head title="商材一覧" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-wa-body wa-body-track">
                <div className="grid grid-cols-1 gap-9 lg:grid-cols-3">
                    <NeonCard>
                        <div className="text-xs font-bold tracking-widest text-wa-muted">SEARCH</div>
                        <div className="mt-3 text-sm font-black tracking-tight text-wa-body">検索 / 絞り込み</div>
                        <div className="mt-6 space-y-4">
                            <input type="text" placeholder="商材名で検索" className="nordic-field" />
                            <select className="nordic-field">
                                <option>カテゴリ：すべて</option>
                                <option>回線</option>
                                <option>モバイル</option>
                                <option>オプション</option>
                            </select>
                            <label className="flex items-center gap-2 text-sm font-semibold text-wa-body">
                                <input type="checkbox" className="h-4 w-4 rounded-sm border-wa-accent/35 text-wa-accent" defaultChecked />
                                有効な商材のみ
                            </label>
                            <ActionButton className="w-full">検索</ActionButton>
                        </div>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2 overflow-x-auto" elevate={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">CATALOG</div>
                                <div className="mt-2 text-lg font-black tracking-tight text-wa-body">商材一覧</div>
                            </div>
                            <div className="text-xs font-semibold text-wa-accent">{list.length} 件</div>
                        </div>

                        <table className="mt-6 w-full min-w-[820px] table-fixed border-collapse">
                            <thead>
                                <tr className="text-left text-xs text-wa-muted">
                                    <th className="w-[38%] border-b border-wa-accent/20 px-3 py-2 font-bold tracking-widest">NAME</th>
                                    <th className="border-b border-wa-accent/20 px-3 py-2 font-bold tracking-widest">CATEGORY</th>
                                    <th className="border-b border-wa-accent/20 px-3 py-2 font-bold tracking-widest">PRICE</th>
                                    <th className="border-b border-wa-accent/20 px-3 py-2 font-bold tracking-widest">STATE</th>
                                    <th className="border-b border-wa-accent/20 px-3 py-2 font-bold tracking-widest">UPDATED</th>
                                    <th className="border-b border-wa-accent/20 px-3 py-2 font-bold tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((p) => (
                                    <tr key={p.id} className="text-sm transition-colors hover:bg-wa-ink/80">
                                        <td className="border-b border-wa-accent/20 px-3 py-3 font-black tracking-tight text-wa-body">
                                            <Link
                                                href={route('products.show', { id: p.id })}
                                                className="block truncate text-wa-accent transition hover:text-wa-accent/80"
                                                title={p.name}
                                            >
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td className="border-b border-wa-accent/20 px-3 py-3 text-wa-muted">{p.category}</td>
                                        <td className="border-b border-wa-accent/20 px-3 py-3 font-semibold text-wa-body">
                                            {p.price === 0 ? '無料' : `¥${p.price.toLocaleString()}`}
                                        </td>
                                        <td className="border-b border-wa-accent/20 px-3 py-3">
                                            <StatusBadge variant={p.is_active ? 'success' : 'muted'}>
                                                {p.is_active ? '有効' : '停止'}
                                            </StatusBadge>
                                        </td>
                                        <td className="border-b border-wa-accent/20 px-3 py-3 text-wa-muted">{p.updated_at}</td>
                                        <td className="border-b border-wa-accent/20 px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('products.show', { id: p.id })}
                                                    className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
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
