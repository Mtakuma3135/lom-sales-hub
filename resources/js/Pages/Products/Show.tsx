import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { PageProps } from '@/types';
import NeonCard from '@/Components/NeonCard';
import ActionButton from '@/Components/ActionButton';
import StatusBadge from '@/Components/StatusBadge';

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
                                onChange={(e) => setDraftScript(e.target.value)}
                                rows={10}
                                readOnly={!isAdmin}
                                className={
                                    'nordic-field mt-3 min-h-[200px] ' + (!isAdmin ? 'opacity-70' : '')
                                }
                            />
                            <div className="mt-4 text-xs text-wa-muted">管理者のみ編集可能</div>
                        </NeonCard>

                        <NeonCard>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">MANUAL URL</div>
                            <input
                                value={draftManualUrl}
                                onChange={(e) => setDraftManualUrl(e.target.value)}
                                readOnly={!isAdmin}
                                className={'nordic-field mt-3 font-mono text-xs ' + (!isAdmin ? 'opacity-70' : '')}
                            />
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <a
                                    href={draftManualUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-w-0 truncate text-xs font-black tracking-widest text-wa-accent transition hover:text-wa-accent/80"
                                >
                                    OPEN
                                </a>
                                <ActionButton
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
                                >
                                    {isSaving ? 'SAVING…' : 'SAVE'}
                                </ActionButton>
                            </div>
                        </NeonCard>
                    </div>
                </div>

                {isLoading ? <div className="mt-6 text-sm text-wa-muted">読み込み中…</div> : null}
            </div>
        </AuthenticatedLayout>
    );
}
