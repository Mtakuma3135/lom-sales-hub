import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type Product = {
    id: number;
    name: string;
    category: string;
    price: number;
    is_active: boolean;
    updated_at: string;
    talk_script: string;
    manual_url: string;
};

export default function Show({ id }: { id: number }) {
    const { props } = usePage<{ auth?: { user?: { role?: string } } }>();
    const isAdmin = (props.auth?.user?.role ?? 'general') === 'admin';

    const [item, setItem] = useState<Product | null>(null);
    const [draftScript, setDraftScript] = useState<string>('');
    const [draftManualUrl, setDraftManualUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const api = useMemo(() => {
        return {
            show: () => fetch(route('portal.api.products.show', { id }), { headers: { Accept: 'application/json' } }),
            update: (payload: { talk_script: string; manual_url: string }) =>
                fetch(route('portal.api.products.update', { id }), {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload),
                }),
        };
    }, [id]);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setErrorMessage(null);
        api.show()
            .then(async (res) => {
                if (!res.ok) throw new Error();
                const json = (await res.json()) as any;
                const p = (json?.data ?? json) as Product;
                if (!mounted) return;
                setItem(p);
                setDraftScript(p?.talk_script ?? '');
                setDraftManualUrl(p?.manual_url ?? '');
            })
            .catch(() => {
                if (mounted) setErrorMessage('取得に失敗しました。');
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [api]);

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">PRODUCT / DETAIL</h2>}>
            <Head title="商材詳細" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-xs font-bold tracking-widest text-white/60">DETAIL</div>
                        <div className="mt-1 text-lg font-black tracking-tight text-white">
                            {item?.name ?? `#${id}`}
                        </div>
                    </div>
                    <Link
                        href={route('products.index')}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/80 hover:bg-white/10"
                    >
                        一覧へ戻る
                    </Link>
                </div>

                {errorMessage ? (
                    <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100/80">
                        {errorMessage}
                    </div>
                ) : null}
                {successMessage ? (
                    <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100/80">
                        {successMessage}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">META</div>
                        <div className="mt-4 space-y-2 text-sm text-white/75">
                            <div>
                                <span className="text-white/45">カテゴリ</span>：{item?.category ?? '—'}
                            </div>
                            <div>
                                <span className="text-white/45">料金</span>：
                                {item ? (item.price === 0 ? '無料' : `¥${item.price.toLocaleString()}`) : '—'}
                            </div>
                            <div>
                                <span className="text-white/45">状態</span>：{item?.is_active ? '有効' : '停止'}
                            </div>
                            <div>
                                <span className="text-white/45">更新</span>：{item?.updated_at ?? '—'}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                            <div className="text-xs font-bold tracking-widest text-white/60">TALK SCRIPT</div>
                            <textarea
                                value={draftScript}
                                onChange={(e) => setDraftScript(e.target.value)}
                                rows={10}
                                readOnly={!isAdmin}
                                className={
                                    'mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black ' +
                                    (!isAdmin ? 'opacity-70' : '')
                                }
                            />
                            <div className="mt-4 text-xs text-white/45">
                                管理者のみ編集可能
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                            <div className="text-xs font-bold tracking-widest text-white/60">MANUAL URL</div>
                            <input
                                value={draftManualUrl}
                                onChange={(e) => setDraftManualUrl(e.target.value)}
                                readOnly={!isAdmin}
                                className={
                                    'mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black ' +
                                    (!isAdmin ? 'opacity-70' : '')
                                }
                            />
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <a
                                    href={draftManualUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-black tracking-widest text-cyan-200/80 hover:text-cyan-200"
                                >
                                    OPEN
                                </a>
                                <button
                                    type="button"
                                    disabled={!isAdmin || isSaving || isLoading}
                                    onClick={async () => {
                                        setIsSaving(true);
                                        setErrorMessage(null);
                                        setSuccessMessage(null);
                                        try {
                                            const res = await api.update({
                                                talk_script: draftScript,
                                                manual_url: draftManualUrl,
                                            });
                                            if (!res.ok) throw new Error();
                                            const json = (await res.json()) as any;
                                            const p = (json?.data ?? json) as Product;
                                            setItem(p);
                                            setSuccessMessage('保存しました。');
                                        } catch {
                                            setErrorMessage('保存に失敗しました。');
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    className="rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2 text-xs font-black tracking-widest text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110 disabled:opacity-40"
                                >
                                    {isSaving ? 'SAVING…' : 'SAVE'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="mt-6 text-sm text-white/45">読み込み中…</div>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}

