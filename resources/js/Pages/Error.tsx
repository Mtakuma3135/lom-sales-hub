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
        <div className="min-h-screen bg-[#050510] text-slate-100">
            <Head title={`${status} ${title}`} />

            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-16">
                <div className="rounded-2xl border border-fuchsia-400/20 bg-white/5 p-8 shadow-[0_0_40px_rgba(217,70,239,0.12)] backdrop-blur">
                    <div className="flex flex-col gap-3">
                        <div className="text-xs tracking-[0.35em] text-fuchsia-200/70">PORTAL</div>
                        <div className="flex items-end gap-4">
                            <div className="text-5xl font-black leading-none text-fuchsia-300">{status}</div>
                            <div className="pb-1 text-lg font-semibold text-slate-200">{title}</div>
                        </div>
                        <div className="text-sm leading-relaxed text-slate-200/80">{message}</div>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <a
                            href="/portal"
                            className="inline-flex items-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/15"
                        >
                            Portalへ戻る
                        </a>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center rounded-lg border border-slate-200/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                        >
                            再読み込み
                        </button>
                    </div>
                </div>

                <div className="text-xs text-slate-300/40">
                    403の場合は管理者に権限付与を依頼してください。
                </div>
            </div>
        </div>
    );
}

