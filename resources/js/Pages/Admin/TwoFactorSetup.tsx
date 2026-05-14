import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import ActionButton from '@/Components/ActionButton';
import InputError from '@/Components/InputError';

export default function TwoFactorSetup({
    secret,
    otpauthUrl,
}: {
    secret: string;
    otpauthUrl: string;
}) {
    const form = useForm({ code: '' });

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-wa-body">
                    管理者用 二要素認証（TOTP）
                </h2>
            }
        >
            <Head title="2FA セットアップ" />

            <div className="py-10">
                <div className="mx-auto max-w-xl space-y-6 rounded-sm border border-wa-accent/20 bg-wa-card p-6 sm:p-8">
                    <p className="text-sm leading-relaxed text-wa-muted">
                        認証アプリ（Google Authenticator 等）で次のシークレットを登録し、表示される
                        6 桁コードを入力してください。
                    </p>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-wa-muted">シークレット</p>
                        <p className="mt-2 break-all rounded-sm border border-wa-accent/15 bg-wa-ink px-3 py-2 font-mono text-sm text-wa-body">
                            {secret}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-wa-muted">otpauth URL</p>
                        <p className="mt-2 break-all text-xs text-wa-muted">{otpauthUrl}</p>
                    </div>

                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post(route('portal.two-factor.store'), { preserveScroll: true });
                        }}
                    >
                        <div>
                            <label htmlFor="code" className="text-xs font-semibold uppercase tracking-widest text-wa-muted">
                                認証コード
                            </label>
                            <input
                                id="code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                className="nordic-field mt-2 max-w-xs tracking-[0.35em]"
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                            />
                            <InputError message={form.errors.code} className="mt-2" />
                        </div>

                        <ActionButton type="submit" disabled={form.processing || form.data.code.length !== 6}>
                            有効化する
                        </ActionButton>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
