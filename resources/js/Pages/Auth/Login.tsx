import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

// ログイン画面（指示書準拠）
export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    // useForm: 初期値明示
    const { data, setData, post, processing, errors, reset } = useForm({
        employee_code: '',
        password: '',
        remember: false,
    });

    // 送信処理（指示書通りパスワード初期化）
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'), // パスワード初期化
        });
    };

    return (
        <GuestLayout>
            <Head title="ログイン" />

            {/* ステータスメッセージ表示（指示書準拠） */}
            {status && (
                <div className="mb-4 rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                {/* 社員コード入力 */}
                <div>
                    <InputLabel htmlFor="employee_code" value="社員番号" />
                    <TextInput
                        id="employee_code"
                        type="text"
                        name="employee_code"
                        className="mt-2 block w-full"
                        value={data.employee_code}
                        onChange={e => setData('employee_code', e.target.value)}
                        required
                        autoComplete="username"
                        isFocused={true}
                    />
                    <InputError message={errors.employee_code} className="mt-2" />
                </div>

                {/* パスワード入力 */}
                <div>
                    <InputLabel htmlFor="password" value="パスワード" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        className="mt-2 block w-full"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* ログイン情報を記憶 */}
                <div className="block pt-1">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-sm text-slate-600">
                            ログイン情報を記憶する
                        </span>
                    </label>
                </div>

                {/* パスワード再発行リンク + ログインボタン */}
                <div className="pt-2">
                    <PrimaryButton className="w-full py-3 text-sm" disabled={processing}>
                        ログイン
                    </PrimaryButton>

                    {canResetPassword && (
                        <div className="mt-4 text-center">
                            <Link
                                href={route('password.request')}
                                className="text-sm text-slate-500 underline hover:text-slate-700"
                            >
                                パスワードをお忘れですか？
                            </Link>
                        </div>
                    )}
                </div>
            </form>
        </GuestLayout>
    );
}
