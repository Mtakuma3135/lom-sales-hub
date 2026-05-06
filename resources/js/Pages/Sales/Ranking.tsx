import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Ranking() {
    return (
        <AuthenticatedLayout header={<span className="text-wa-body wa-body-track">案件・KPI（ランキング）</span>}>
            <Head title="案件・KPI（ランキング）" />
            <div className="mx-auto max-w-6xl px-6 py-6">
                <div className="rounded-sm border border-wa-accent/20 bg-wa-card p-8">
                    <div className="text-sm font-semibold text-wa-body wa-body-track">KPIランキング</div>
                    <div className="mt-3 text-sm text-wa-muted">ここにランキングが入ります（準備中）。</div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
