import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={<h2 className="wa-body-track text-sm font-semibold text-wa-body">ダッシュボード</h2>}
        >
            <Head title="ダッシュボード" />

            <div className="mx-auto max-w-3xl">
                <div className="border border-wa-accent/20 bg-wa-card p-12">
                    <p className="wa-body-track text-sm leading-relaxed text-wa-muted">ログインしています！</p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
