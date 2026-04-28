import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Trend() {
    return (
        <AuthenticatedLayout header={<span>案件・KPI（トレンド）</span>}>
            <Head title="案件・KPI（トレンド）" />
            <div className="mx-auto max-w-6xl px-6 py-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">
                        KPIトレンド
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                        ここにトレンドが入ります（準備中）。
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

