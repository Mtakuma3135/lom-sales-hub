import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        employee_code: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="ユーザー登録" />

            <h1 className="mb-8 mt-8 text-center text-2xl font-semibold text-wa-body">新規ユーザー登録</h1>
            <form
                onSubmit={submit}
                className="mx-auto max-w-md space-y-6 rounded-sm border border-wa-accent/20 bg-wa-ink p-8"
            >
                <div>
                    <InputLabel htmlFor="name" value="名前" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={e => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="employee_code" value="社員コード" />
                    <TextInput
                        id="employee_code"
                        name="employee_code"
                        value={data.employee_code}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={e => setData('employee_code', e.target.value)}
                        required
                    />
                    <InputError message={errors.employee_code} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="パスワード" />
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

                <div>
                    <InputLabel htmlFor="password_confirmation" value="パスワード（確認）" />
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

                <p className="text-xs text-wa-muted">
                    登録後の権限は「一般」です。管理者は管理画面から付与してください。ログインは社員コードとパスワードです。
                </p>

                <div className="flex items-center justify-end space-x-3">
                    <Link
                        href={route('login')}
                        className="rounded-sm text-sm text-wa-muted underline transition hover:text-wa-body focus:outline-none focus:ring-1 focus:ring-wa-accent/35"
                    >
                        すでに登録済みの方はこちら
                    </Link>
                    <PrimaryButton className="ms-4" disabled={processing}>
                        登録する
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
