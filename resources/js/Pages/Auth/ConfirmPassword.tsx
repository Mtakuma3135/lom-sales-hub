import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

// パスワード確認画面（指示書準拠）
export default function ConfirmPassword() {
    // useForm: 初期値明示
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    // 送信処理（指示書通りパスワード初期化）
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="パスワード確認" />

            <div className="mb-6 text-center text-sm leading-relaxed text-wa-muted">
                セキュリティ保護のため、続行する前にパスワードを入力してください。
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="password" value="パスワード" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        className="mt-1 block w-full"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        required
                        isFocused={true}
                        autoComplete="current-password"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        確認する
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
