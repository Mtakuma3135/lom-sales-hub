import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

// メール認証（指示書準拠）
export default function VerifyEmail({ status }: { status?: string }) {
    // useForm: 空オブジェクトで初期化
    const { post, processing } = useForm({});

    // 送信処理
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="メール認証" />

            <div className="mb-6 text-center text-sm leading-relaxed text-wa-muted">
                ご登録ありがとうございます。ご利用を開始する前に、ご登録のメールアドレス宛にお送りした認証メール内のリンクをクリックして、メール認証を完了してください。<br />
                <span className="inline-block mt-2">
                    メールが届かない場合は、下記ボタンより再送できます。
                </span>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 border border-teal-500/35 bg-wa-ink px-4 py-3 text-center text-sm font-medium text-teal-300">
                    新しい認証用リンクを、ご登録のメールアドレスへ再送しました。
                </div>
            )}

            <form onSubmit={submit} className="max-w-md mx-auto">
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton className="w-full" disabled={processing}>
                        認証メールを再送する
                    </PrimaryButton>
                </div>
            </form>

            <div className="mt-6 flex justify-center">
                <form method="post" action={route('logout')}>
                    <PrimaryButton
                        type="submit"
                        className="border border-wa-accent/25 bg-wa-ink text-wa-body hover:border-wa-accent/45 hover:bg-wa-card"
                    >
                        ログアウト
                    </PrimaryButton>
                </form>
            </div>
        </GuestLayout>
    );
}
