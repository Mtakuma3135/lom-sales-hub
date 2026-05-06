import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

// パスワード再発行リクエスト（指示書準拠）
export default function ForgotPassword({ status }: { status?: string }) {
    // useForm: 初期値明示
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    // 送信処理
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'), {
            onFinish: () => reset('email'), // 指示書通り送信後は初期化
        });
    };

    return (
        <GuestLayout>
            <Head title="パスワード再発行" />

            <div className="mb-6 text-center text-sm leading-relaxed text-wa-muted">
                パスワードをお忘れですか？ご登録のメールアドレスを入力してください。<br />
                パスワード再設定用のリンクをメールでお送りします。
            </div>

            {status && (
                <div className="mb-4 border border-teal-500/35 bg-wa-ink px-4 py-3 text-center text-sm font-medium text-teal-300">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="email" value="メールアドレス" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        required
                        isFocused={true}
                        autoComplete="username"
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>
                <div className="flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        パスワード再発行メールを送信
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
