import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

// パスワード再設定画面（指示書準拠）
export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    // useForm: 初期値を明示、パスワード系は送信後に初期化（指示書通り）
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email ?? '',
        password: '',
        password_confirmation: '',
    });

    // 送信処理（指示書どおりパスワード系を初期化）
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="パスワード再設定" />

            <h1 className="text-2xl font-bold text-center mt-8 mb-8">パスワード再設定</h1>

            <form 
                onSubmit={submit}
                className="max-w-md mx-auto bg-white rounded-lg shadow p-8 space-y-6"
            >
                {/* メールアドレス */}
                <div>
                    <InputLabel htmlFor="email" value="メールアドレス" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={e => setData('email', e.target.value)}
                        required
                        // 認証済みならreadonly, 初期値から変更できるようにする場合はコメントアウト
                        // readOnly
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                {/* 新しいパスワード */}
                <div>
                    <InputLabel htmlFor="password" value="新しいパスワード" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={e => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* 新しいパスワード（確認） */}
                <div>
                    <InputLabel htmlFor="password_confirmation" value="新しいパスワード（確認）" />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={e => setData('password_confirmation', e.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        パスワードを再設定する
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
