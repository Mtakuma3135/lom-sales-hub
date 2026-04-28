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

            <div className="mb-6 text-slate-700 text-center text-sm">
                ご登録ありがとうございます。ご利用を開始する前に、ご登録のメールアドレス宛にお送りした認証メール内のリンクをクリックして、メール認証を完了してください。<br />
                <span className="inline-block mt-2">
                    メールが届かない場合は、下記ボタンより再送できます。
                </span>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600 text-center">
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
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        ログアウト
                    </PrimaryButton>
                </form>
            </div>
        </GuestLayout>
    );
}
