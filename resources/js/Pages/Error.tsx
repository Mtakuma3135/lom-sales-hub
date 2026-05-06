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
        <div className="min-h-screen bg-wa-ink text-wa-body wa-body-track">
            <Head title={`${status} ${title}`} />

            <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
                <div className="border border-wa-accent/20 bg-wa-card p-10">
                    <div className="flex flex-col gap-4">
                        <div className="text-xs tracking-[0.35em] text-wa-accent/90">PORTAL</div>
                        <div className="flex items-end gap-4">
                            <div className="wa-nums text-5xl font-semibold leading-none text-wa-accent">{status}</div>
                            <div className="pb-1 text-lg font-semibold text-wa-body">{title}</div>
                        </div>
                        <div className="text-sm leading-relaxed text-wa-muted">{message}</div>
                    </div>

                    <div className="mt-10 flex flex-wrap gap-4">
                        <a
                            href="/portal"
                            className="inline-flex items-center rounded-sm border border-wa-accent/35 px-5 py-2.5 text-sm font-semibold text-wa-accent transition hover:border-wa-accent/50 hover:bg-wa-accent/10"
                        >
                            Portalへ戻る
                        </a>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center rounded-sm border border-wa-accent/25 bg-wa-ink px-5 py-2.5 text-sm font-semibold text-wa-body transition hover:border-wa-accent/40"
                        >
                            再読み込み
                        </button>
                    </div>
                </div>

                <div className="text-xs text-wa-muted">403の場合は管理者に権限付与を依頼してください。</div>
            </div>
        </div>
    );
}
