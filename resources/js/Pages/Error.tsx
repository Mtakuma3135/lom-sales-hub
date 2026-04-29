import { Head } from '@inertiajs/react';

type Props = {
    status: number;
};

const titles: Record<number, string> = {
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Server Error',
    503: 'Service Unavailable',
};

const messages: Record<number, string> = {
    403: 'この操作を実行する権限がありません。',
    404: 'ページが見つかりませんでした。',
    500: 'サーバーでエラーが発生しました。',
    503: 'メンテナンス中です。しばらくしてからお試しください。',
};

export default function Error({ status }: Props) {
    const title = titles[status] ?? 'Error';
    const message = messages[status] ?? 'エラーが発生しました。';

    return (
        <div className="min-h-screen bg-stone-100 text-stone-800">
            <Head title={`${status} ${title}`} />

            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-16">
                <div className="rounded-2xl border border-emerald-100/70 bg-emerald-50/50 p-8 shadow-nordic ring-1 ring-stone-900/5">
                    <div className="flex flex-col gap-3">
                        <div className="text-xs tracking-[0.35em] text-emerald-700/90">PORTAL</div>
                        <div className="flex items-end gap-4">
                            <div className="text-5xl font-black leading-none text-emerald-700">{status}</div>
                            <div className="pb-1 text-lg font-semibold text-stone-800">{title}</div>
                        </div>
                        <div className="text-sm leading-relaxed text-stone-600">{message}</div>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <a
                            href="/portal"
                            className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100/80"
                        >
                            Portalへ戻る
                        </a>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center rounded-xl border border-stone-200 bg-white/90 px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
                        >
                            再読み込み
                        </button>
                    </div>
                </div>

                <div className="text-xs text-stone-500">403の場合は管理者に権限付与を依頼してください。</div>
            </div>
        </div>
    );
}
