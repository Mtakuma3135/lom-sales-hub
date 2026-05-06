import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { PageProps } from '@/types';
import NeonCard from '@/Components/NeonCard';
import ActionButton from '@/Components/ActionButton';
import StatusBadge from '@/Components/StatusBadge';
import DetailDrawer from '@/Components/DetailDrawer';
import NoticeFeedItem from '@/Components/NoticeFeedItem';

type Notice = {
    id: number;
    title: string;
    body: string;
    is_pinned: boolean;
    published_at: string;
};

type NoticesProp = {
    data: Notice[];
};

const btnGhost =
    'w-full rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-3 text-sm font-black tracking-tight text-wa-body transition hover:border-wa-accent/40';

export default function Index({ notices }: { notices?: NoticesProp }) {
    const { props } = usePage<PageProps>();
    const isAdmin = (props.auth?.user?.role ?? 'general') === 'admin';

    const list =
        notices?.data ??
        [
            {
                id: 1,
                title: '【重要】4月度の営業目標について',
                body: '今月の重点は「初回トークの品質」です。録音チェックの基準を更新しました。',
                published_at: '2026-04-18 14:30',
                is_pinned: true,
            },
            {
                id: 2,
                title: '新商材「光回線プラン」のトークスクリプト公開',
                body: 'ヒアリング質問とクロージング例を追加しました。',
                published_at: '2026-04-20 10:00',
                is_pinned: false,
            },
            {
                id: 3,
                title: 'システムメンテナンスのお知らせ',
                body: '4/28 02:00-03:00 に停止の可能性があります。',
                published_at: '2026-04-16 09:00',
                is_pinned: false,
            },
            {
                id: 4,
                title: 'FAQ更新：本人確認のトーク例を追加',
                body: '本人確認の断られ対応の例文を追加しました。',
                published_at: '2026-04-15 18:10',
                is_pinned: false,
            },
        ];

    const [items, setItems] = useState<Notice[]>(list);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [q, setQ] = useState<string>('');
    const [draftTitle, setDraftTitle] = useState<string>('');
    const [draftBody, setDraftBody] = useState<string>('');
    const [draftPinned, setDraftPinned] = useState<boolean>(false);
    const [draftPublishedAt, setDraftPublishedAt] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const api = useMemo(() => {
        return {
            index: (query: string) => {
                const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
                return fetch(`${route('portal.api.notices.index')}${qs}`, { headers: { Accept: 'application/json' } });
            },
            show: (id: number) =>
                fetch(route('portal.api.notices.show', { id }), { headers: { Accept: 'application/json' } }),
            store: (payload: {
                title: string;
                body: string;
                is_pinned: boolean;
                published_at?: string | null;
            }) =>
                fetch(route('portal.api.notices.store'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload),
                }),
            update: (id: number, payload: { title?: string; body?: string; is_pinned?: boolean; published_at?: string | null }) =>
                fetch(route('portal.api.notices.update', { id }), {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload),
                }),
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        api.index('')
            .then(async (res) => {
                if (!res.ok) return;
                const json = (await res.json()) as unknown;
                if (!Array.isArray(json)) return;
                if (mounted) setItems(json as Notice[]);
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, [api]);

    // Home などから `?open=<id>` で遷移したとき、自動で詳細を開く
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('open');
        const id = raw ? Number(raw) : NaN;
        if (!Number.isFinite(id) || id <= 0) return;
        void openDetail(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        setIsCreating(true);
        setSelectedId(null);
        setSelectedNotice(null);
        setDraftTitle('');
        setDraftBody('');
        setDraftPinned(false);
        setDraftPublishedAt('');
        setErrorMessage(null);
        setSuccessMessage(null);
    };

    const openEdit = async (id: number) => {
        setIsCreating(false);
        setSelectedId(id);
        setSelectedNotice(null);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            const res = await api.show(id);
            if (!res.ok) throw new Error();
            const json = (await res.json()) as any;
            const n = (json?.data ?? json) as Notice;
            setDraftTitle(n?.title ?? '');
            setDraftBody(n?.body ?? '');
            setDraftPinned(!!n?.is_pinned);
            setDraftPublishedAt((n?.published_at ?? '').replace('T', ' ').slice(0, 19));
        } catch {
            setErrorMessage('詳細の取得に失敗しました。');
        }
    };

    const openDetail = async (id: number) => {
        setIsCreating(false);
        setSelectedId(id);
        setSelectedNotice(null);
        setIsDetailLoading(true);
        setErrorMessage(null);
        try {
            const res = await api.show(id);
            if (!res.ok) throw new Error();
            const json = (await res.json()) as any;
            const n = (json?.data ?? json) as Notice;
            setSelectedNotice(n);
        } catch {
            setSelectedNotice(null);
            setErrorMessage('詳細の取得に失敗しました。');
        } finally {
            setIsDetailLoading(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">NOTICE / FEED</h2>}>
            <Head title="周知事項" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-wa-body wa-body-track">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard>
                        <div className="text-xs font-bold tracking-widest text-wa-muted">FILTER</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-wa-body">絞り込み</div>
                        <div className="mt-4 space-y-3">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="キーワード検索"
                                className="nordic-field"
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    setErrorMessage(null);
                                    try {
                                        const res = await api.index(q);
                                        if (!res.ok) throw new Error();
                                        const json = (await res.json()) as unknown;
                                        setItems(Array.isArray(json) ? (json as Notice[]) : []);
                                    } catch {
                                        setErrorMessage('検索に失敗しました。');
                                    }
                                }}
                                className={btnGhost}
                            >
                                検索
                            </button>
                            <div className="rounded-sm border border-teal-500/25 bg-wa-ink px-3 py-3 text-xs text-teal-300/90">
                                PIN は常に最上部に表示されます
                            </div>
                            <ActionButton className="w-full" disabled={!isAdmin} onClick={openCreate}>
                                新規作成（管理者）
                            </ActionButton>
                            <button type="button" className={btnGhost}>
                                下書き
                            </button>

                            {errorMessage ? (
                                <div className="rounded-sm border border-red-500/35 bg-wa-ink px-4 py-3 text-xs text-red-300">
                                    {errorMessage}
                                </div>
                            ) : null}
                            {successMessage ? (
                                <div className="rounded-sm border border-teal-500/35 bg-wa-ink px-4 py-3 text-xs text-teal-300">
                                    {successMessage}
                                </div>
                            ) : null}

                            {(isCreating || selectedId !== null) && isAdmin ? (
                                <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-4">
                                    <div className="text-xs font-bold tracking-widest text-wa-muted">
                                        {isCreating ? 'CREATE' : 'EDIT'}
                                    </div>
                                    <div className="mt-3 space-y-3">
                                        <input
                                            value={draftTitle}
                                            onChange={(e) => setDraftTitle(e.target.value)}
                                            placeholder="タイトル（最大100）"
                                            className="nordic-field"
                                        />
                                        <textarea
                                            value={draftBody}
                                            onChange={(e) => setDraftBody(e.target.value)}
                                            rows={5}
                                            placeholder="本文（最大10000）"
                                            className="nordic-field min-h-[120px]"
                                        />
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <label className="flex items-center gap-2 text-xs font-semibold text-wa-body">
                                                <input
                                                    type="checkbox"
                                                    checked={draftPinned}
                                                    onChange={(e) => setDraftPinned(e.target.checked)}
                                                    className="rounded-sm border-wa-accent/35 text-wa-accent"
                                                />
                                                PIN
                                            </label>
                                            <input
                                                value={draftPublishedAt}
                                                onChange={(e) => setDraftPublishedAt(e.target.value)}
                                                placeholder="published_at (YYYY-MM-DD HH:mm:ss)"
                                                className="nordic-field w-48 py-2 text-xs"
                                            />
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCreating(false);
                                                    setSelectedId(null);
                                                    setSelectedNotice(null);
                                                    setDraftTitle('');
                                                    setDraftBody('');
                                                    setDraftPinned(false);
                                                    setDraftPublishedAt('');
                                                    setErrorMessage(null);
                                                    setSuccessMessage(null);
                                                }}
                                                className="rounded-sm border border-wa-accent/25 bg-wa-card px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/40"
                                            >
                                                CLOSE
                                            </button>
                                            <ActionButton
                                                disabled={isSaving}
                                                onClick={async () => {
                                                    setIsSaving(true);
                                                    setErrorMessage(null);
                                                    setSuccessMessage(null);
                                                    try {
                                                        if (isCreating) {
                                                            const res = await api.store({
                                                                title: draftTitle,
                                                                body: draftBody,
                                                                is_pinned: draftPinned,
                                                                published_at: draftPublishedAt ? draftPublishedAt : null,
                                                            });
                                                            if (!res.ok) throw new Error();
                                                            const json = (await res.json()) as any;
                                                            const n = (json?.data ?? json) as Notice;
                                                            setItems((prev) => [n, ...prev]);
                                                            setSuccessMessage('作成しました。');
                                                        } else if (selectedId !== null) {
                                                            const res = await api.update(selectedId, {
                                                                title: draftTitle,
                                                                body: draftBody,
                                                                is_pinned: draftPinned,
                                                                published_at: draftPublishedAt ? draftPublishedAt : null,
                                                            });
                                                            if (!res.ok) throw new Error();
                                                            const json = (await res.json()) as any;
                                                            const n = (json?.data ?? json) as Notice;
                                                            setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
                                                            setSuccessMessage('更新しました。');
                                                        }
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
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2" elevate={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">FEED</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-wa-body">お知らせ</div>
                            </div>
                            <div className="text-xs font-semibold text-wa-accent">{list.length} 件</div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {items.map((n) => (
                                <div key={n.id} className="space-y-2">
                                    <NoticeFeedItem
                                        title={n.title}
                                        body={n.body}
                                        publishedAt={n.published_at}
                                        isPinned={n.is_pinned}
                                        onOpen={() => openDetail(n.id)}
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isAdmin) openEdit(n.id);
                                                else openDetail(n.id);
                                            }}
                                            className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40 hover:bg-wa-card"
                                        >
                                            {isAdmin ? '編集' : '詳細'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => e.stopPropagation()}
                                            className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-2 text-xs font-black tracking-tight text-wa-muted transition hover:border-wa-accent/35 hover:text-wa-body"
                                        >
                                            既読
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </NeonCard>
                </div>
            </div>

            <DetailDrawer
                open={selectedId !== null}
                title={`NOTICE #${selectedId ?? ''}`}
                onClose={() => {
                    setSelectedId(null);
                    setSelectedNotice(null);
                    setIsDetailLoading(false);
                }}
            >
                {isDetailLoading ? (
                    <div className="rounded-sm border border-wa-accent/20 bg-wa-card px-4 py-6 text-sm text-wa-muted">
                        読み込み中…
                    </div>
                ) : selectedNotice ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {selectedNotice.is_pinned ? <StatusBadge variant="primary" pulse>PIN</StatusBadge> : null}
                                    <div className="truncate text-base font-black tracking-tight text-wa-body">
                                        {selectedNotice.title}
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-wa-muted">公開: {selectedNotice.published_at}</div>
                            </div>
                            {isAdmin ? (
                                <ActionButton
                                    onClick={() => {
                                        const id = selectedNotice.id;
                                        setSelectedId(null);
                                        setSelectedNotice(null);
                                        openEdit(id);
                                    }}
                                >
                                    編集へ
                                </ActionButton>
                            ) : null}
                        </div>

                        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-3">
                            <div className="text-[11px] font-bold tracking-widest text-wa-muted">BODY</div>
                            <div className="mt-2 whitespace-pre-wrap text-sm text-wa-body">{selectedNotice.body}</div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-sm border border-wa-accent/20 bg-wa-card px-4 py-6 text-sm text-wa-muted">
                        データがありません
                    </div>
                )}
            </DetailDrawer>
        </AuthenticatedLayout>
    );
}
