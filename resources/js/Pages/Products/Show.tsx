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
    const [draftName, setDraftName] = useState('');
    const [draftCategory, setDraftCategory] = useState('');
    const [draftPrice, setDraftPrice] = useState('');
    const [draftActive, setDraftActive] = useState(true);
    const [draftScript, setDraftScript] = useState<string>('');
    const [draftManualUrl, setDraftManualUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const api = useMemo(() => {
        return {
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
        };
    }, [id]);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setErrorMessage(null);
        api
            .show()
            .then(async (res) => {
                if (!res.ok) throw new Error();
                const json = (await res.json()) as any;
                const p = (json?.data ?? json) as Product;
                if (!mounted) return;
                setItem(p);
                setDraftName(p?.name ?? '');
                setDraftCategory(p?.category ?? '');
                setDraftPrice(String(p?.price ?? 0));
                setDraftActive(!!p?.is_active);
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

    const persist = async () => {
        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            const priceNum = Math.max(0, Number.parseInt(String(draftPrice).replace(/[^0-9]/g, ''), 10) || 0);
            const payload: Record<string, unknown> = {
                talk_script: draftScript,
                manual_url: draftManualUrl,
            };
            if (isAdmin) {
                payload.name = draftName;
                payload.category = draftCategory;
                payload.price = priceNum;
                payload.is_active = draftActive;
            }
            const res = await api.update(payload);
            if (!res.ok) throw new Error();
            const json = (await res.json()) as any;
            const p = (json?.data ?? json) as Product;
            setItem(p);
            setDraftName(p?.name ?? '');
            setDraftCategory(p?.category ?? '');
            setDraftPrice(String(p?.price ?? 0));
            setDraftActive(!!p?.is_active);
            setDraftScript(p?.talk_script ?? '');
            setDraftManualUrl(p?.manual_url ?? '');
            setSuccessMessage('保存しました。');
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
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs font-bold tracking-widest text-wa-muted">DETAIL</div>
                        <div className="mt-1 break-words text-lg font-black tracking-tight text-wa-body">
                            {item?.name ?? `#${id}`}
                        </div>
                    </div>
                    <Link
                        href={route('products.index')}
                        className="shrink-0 rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/45"
                    >
                        一覧へ戻る
                    </Link>
                </div>

                {errorMessage ? (
                    <div className="mb-4 rounded-sm border border-red-500/35 bg-wa-ink px-4 py-3 text-xs text-red-300">
                        {errorMessage}
                    </div>
                ) : null}
                {successMessage ? (
                    <div className="mb-4 rounded-sm border border-teal-500/35 bg-wa-ink px-4 py-3 text-xs text-teal-300">
                        {successMessage}
                    </div>
                ) : null}

                {isAdmin ? (
                    <NeonCard>
                        <div className="text-xs font-bold tracking-widest text-wa-muted">META</div>
                        <div className="mt-4 space-y-8 text-sm">
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">NAME</div>
                                    <input
                                        value={draftName}
                                        onChange={(e) => setDraftName(e.target.value)}
                                        className="nordic-field mt-1 w-full"
                                    />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">CATEGORY</div>
                                    <input
                                        value={draftCategory}
                                        onChange={(e) => setDraftCategory(e.target.value)}
                                        className="nordic-field mt-1 w-full"
                                    />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">PRICE（円）</div>
                                    <input
                                        type="number"
                                        min={0}
                                        value={draftPrice}
                                        onChange={(e) => setDraftPrice(e.target.value)}
                                        className="nordic-field mt-1 w-full tabular-nums"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-wa-body">
                                    <input
                                        type="checkbox"
                                        checked={draftActive}
                                        onChange={(e) => setDraftActive(e.target.checked)}
                                        className="h-4 w-4 rounded-sm border-wa-accent/35 text-wa-accent"
                                    />
                                    有効（販売中）
                                </label>
                                <div className="text-xs text-wa-muted">更新: {item?.updated_at ?? '—'}</div>
                            </div>

                            <div className="border-t border-wa-accent/15 pt-6">
                                <div className="text-xs font-bold tracking-widest text-wa-muted">TALK SCRIPT</div>
                                <textarea
                                    value={draftScript}
                                    onChange={(e) => setDraftScript(e.target.value)}
                                    rows={10}
                                    className="nordic-field mt-3 min-h-[200px]"
                                />
                            </div>

                            <div className="border-t border-wa-accent/15 pt-6">
                                <div className="text-xs font-bold tracking-widest text-wa-muted">MANUAL URL</div>
                                <input
                                    value={draftManualUrl}
                                    onChange={(e) => setDraftManualUrl(e.target.value)}
                                    className="nordic-field mt-3 font-mono text-xs"
                                />
                                <div className="mt-3">
                                    <a
                                        href={draftManualUrl || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-black tracking-widest text-wa-accent transition hover:text-wa-accent/80"
                                    >
                                        OPEN
                                    </a>
                                </div>
                            </div>

                            <div className="border-t border-wa-accent/15 pt-6">
                                <ActionButton
                                    className="w-full sm:w-auto"
                                    disabled={isSaving || isLoading}
                                    onClick={() => void persist()}
                                >
                                    {isSaving ? '保存中…' : '保存'}
                                </ActionButton>
                            </div>
                        </div>
                    </NeonCard>
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <NeonCard>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">META</div>
                            <div className="mt-4 space-y-2 text-sm text-wa-muted">
                                <div>
                                    <span className="text-wa-body/80">カテゴリ</span>：{item?.category ?? '—'}
                                </div>
                                <div>
                                    <span className="text-wa-body/80">料金</span>：
                                    {item ? (item.price === 0 ? '無料' : `¥${item.price.toLocaleString()}`) : '—'}
                                </div>
                                <div>
                                    <span className="text-wa-body/80">状態</span>：
                                    <span className="ml-2">
                                        <StatusBadge variant={item?.is_active ? 'success' : 'muted'}>
                                            {item?.is_active ? '有効' : '停止'}
                                        </StatusBadge>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-wa-body/80">更新</span>：{item?.updated_at ?? '—'}
                                </div>
                            </div>
                        </NeonCard>

                        <div className="space-y-6 lg:col-span-2">
                            <NeonCard>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">TALK SCRIPT</div>
                                <textarea
                                    value={draftScript}
                                    onChange={() => {}}
                                    readOnly
                                    rows={10}
                                    className="nordic-field mt-3 min-h-[200px] opacity-70"
                                />
                                <div className="mt-4 text-xs text-wa-muted">管理者のみ編集可能</div>
                            </NeonCard>

                            <NeonCard>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">MANUAL URL</div>
                                <input
                                    value={draftManualUrl}
                                    onChange={() => {}}
                                    readOnly
                                    className="nordic-field mt-3 font-mono text-xs opacity-70"
                                />
                                <div className="mt-3">
                                    <a
                                        href={draftManualUrl || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-black tracking-widest text-wa-accent transition hover:text-wa-accent/80"
                                    >
                                        OPEN
                                    </a>
                                </div>
                            </NeonCard>
                        </div>
                    </div>
                )}

                {isLoading ? <div className="mt-6 text-sm text-wa-muted">読み込み中…</div> : null}
            </div>
        </AuthenticatedLayout>
    );
}
