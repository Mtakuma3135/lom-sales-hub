import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { PageProps } from '@/types';
import NeonCard from '@/Components/NeonCard';
import ActionButton from '@/Components/ActionButton';
import StatusBadge from '@/Components/StatusBadge';

function csrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

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
    const { props } = usePage<PageProps>();
    const isAdmin = (props.auth?.user?.role ?? 'general') === 'admin';

    const [item, setItem] = useState<Product | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [draftCategory, setDraftCategory] = useState('');
    const [draftPrice, setDraftPrice] = useState('');
    const [draftActive, setDraftActive] = useState(true);
    const [draftScript, setDraftScript] = useState('');
    const [draftManualUrl, setDraftManualUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const api = useMemo(() => ({
        show: () =>
            fetch(route('portal.api.products.show', { id }), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            }),
        update: (payload: Record<string, unknown>) =>
            fetch(route('portal.api.products.update', { id }), {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf(),
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            }),
    }), [id]);

    const applyItem = (p: Product) => {
        setItem(p);
        setDraftName(p.name ?? '');
        setDraftCategory(p.category ?? '');
        setDraftPrice(String(p.price ?? 0));
        setDraftActive(!!p.is_active);
        setDraftScript(p.talk_script ?? '');
        setDraftManualUrl(p.manual_url ?? '');
    };

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setErrorMessage(null);
        api.show()
            .then(async (res) => {
                if (!res.ok) throw new Error();
                const json = (await res.json()) as any;
                if (mounted) applyItem((json?.data ?? json) as Product);
            })
            .catch(() => { if (mounted) setErrorMessage('取得に失敗しました。'); })
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, [api]);

    const openEdit = () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        if (item) applyItem(item);
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsEditing(false);
    };

    const persist = async () => {
        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            const priceNum = Math.max(0, Number.parseInt(String(draftPrice).replace(/[^0-9]/g, ''), 10) || 0);
            const res = await api.update({
                name: draftName,
                category: draftCategory,
                price: priceNum,
                is_active: draftActive,
                talk_script: draftScript,
                manual_url: draftManualUrl,
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as any;
            applyItem((json?.data ?? json) as Product);
            setSuccessMessage('保存しました。');
            setIsEditing(false);
        } catch {
            setErrorMessage('保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">PRODUCT / DETAIL</h2>}>
            <Head title="商材詳細" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-wa-body wa-body-track">

                {/* ヘッダー行 */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs font-bold tracking-widest text-wa-muted">PRODUCT / DETAIL</div>
                        <div className="mt-1 break-words text-lg font-black tracking-tight text-wa-body">
                            {item?.name ?? `#${id}`}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {isAdmin && !isEditing && !isLoading && item ? (
                            <button
                                type="button"
                                onClick={openEdit}
                                className="rounded-sm border border-wa-accent/35 bg-wa-ink px-4 py-2 text-xs font-black tracking-widest text-wa-accent transition hover:border-wa-accent/60"
                            >
                                EDIT
                            </button>
                        ) : null}
                        <Link
                            href={route('products.index')}
                            className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/45"
                        >
                            一覧へ戻る
                        </Link>
                    </div>
                </div>

                {errorMessage ? (
                    <div className="mb-4 rounded-sm border border-red-500/35 bg-wa-ink px-4 py-3 text-xs text-red-300">{errorMessage}</div>
                ) : null}
                {successMessage ? (
                    <div className="mb-4 rounded-sm border border-teal-500/35 bg-wa-ink px-4 py-3 text-xs text-teal-300">{successMessage}</div>
                ) : null}

                {isLoading ? (
                    <div className="text-sm text-wa-muted">読み込み中…</div>
                ) : isEditing && isAdmin ? (
                    /* 編集モード（管理者のみ） */
                    <NeonCard>
                        <div className="text-xs font-bold tracking-widest text-wa-muted">EDIT</div>
                        <div className="mt-4 space-y-6 text-sm">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">NAME</div>
                                    <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="nordic-field mt-1 w-full" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">CATEGORY</div>
                                    <input value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} className="nordic-field mt-1 w-full" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">PRICE（円）</div>
                                    <input type="number" min={0} value={draftPrice} onChange={(e) => setDraftPrice(e.target.value)} className="nordic-field mt-1 w-full tabular-nums" />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-wa-body">
                                        <input
                                            type="checkbox"
                                            checked={draftActive}
                                            onChange={(e) => setDraftActive(e.target.checked)}
                                            className="h-4 w-4 rounded-sm border-wa-accent/35 text-wa-accent"
                                        />
                                        有効（販売中）
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-wa-accent/15 pt-4">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">TALK SCRIPT</div>
                                <textarea
                                    value={draftScript}
                                    onChange={(e) => setDraftScript(e.target.value)}
                                    rows={12}
                                    className="nordic-field mt-2 min-h-[200px] w-full"
                                />
                            </div>

                            <div className="border-t border-wa-accent/15 pt-4">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">MANUAL URL</div>
                                <input value={draftManualUrl} onChange={(e) => setDraftManualUrl(e.target.value)} className="nordic-field mt-2 w-full font-mono text-xs" />
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-wa-accent/15 pt-4">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/40"
                                >
                                    CANCEL
                                </button>
                                <ActionButton disabled={isSaving} onClick={() => void persist()}>
                                    {isSaving ? '保存中…' : '保存'}
                                </ActionButton>
                            </div>
                        </div>
                    </NeonCard>
                ) : (
                    /* 閲覧モード（全ユーザー共通） */
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <NeonCard>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">META</div>
                            <dl className="mt-4 space-y-3 text-sm">
                                <div>
                                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">CATEGORY</dt>
                                    <dd className="mt-0.5 text-wa-body">{item?.category || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">PRICE</dt>
                                    <dd className="mt-0.5 font-black tabular-nums text-wa-body">
                                        {item ? (item.price === 0 ? '無料' : `¥${item.price.toLocaleString()}`) : '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">STATUS</dt>
                                    <dd className="mt-0.5">
                                        <StatusBadge variant={item?.is_active ? 'success' : 'muted'}>
                                            {item?.is_active ? '有効' : '停止'}
                                        </StatusBadge>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">UPDATED</dt>
                                    <dd className="mt-0.5 text-wa-muted">{item?.updated_at ?? '—'}</dd>
                                </div>
                            </dl>
                        </NeonCard>

                        <div className="space-y-6 lg:col-span-2">
                            <NeonCard>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">TALK SCRIPT</div>
                                {item?.talk_script ? (
                                    <pre className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-wa-body">
                                        {item.talk_script}
                                    </pre>
                                ) : (
                                    <p className="mt-3 text-sm text-wa-muted">未設定</p>
                                )}
                            </NeonCard>

                            <NeonCard>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">MANUAL</div>
                                {item?.manual_url ? (
                                    <a
                                        href={item.manual_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-block break-all text-xs font-black tracking-widest text-wa-accent transition hover:text-wa-accent/80"
                                    >
                                        マニュアルを開く →
                                    </a>
                                ) : (
                                    <p className="mt-3 text-sm text-wa-muted">未設定</p>
                                )}
                            </NeonCard>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
