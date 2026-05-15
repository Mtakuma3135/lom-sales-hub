import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
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
    published_at: string | null;
    is_read?: boolean;
};

type NoticesProp = {
    data: Notice[];
};

function NoticeMetaFields({
    pinned,
    onPinnedChange,
    publishedLocal,
    onPublishedLocalChange,
}: {
    pinned: boolean;
    onPinnedChange: (v: boolean) => void;
    publishedLocal: string;
    onPublishedLocalChange: (v: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
                value={pinned ? '1' : '0'}
                onChange={(e) => onPinnedChange(e.target.value === '1')}
                className="nordic-field py-2 text-xs font-black"
            >
                <option value="0">PIN なし</option>
                <option value="1">PIN 固定</option>
            </select>
            <input
                type="datetime-local"
                value={publishedLocal}
                onChange={(e) => onPublishedLocalChange(e.target.value)}
                className="nordic-field py-2 text-xs sm:col-span-2"
            />
        </div>
    );
}

const btnGhost =
    'w-full rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-3 text-sm font-black tracking-tight text-wa-body transition hover:border-wa-accent/40';

function csrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

function formatNaiveNow(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** API の日時文字列 → datetime-local 用 */
function isoToDatetimeLocal(raw: string | null | undefined): string {
    if (!raw) return '';
    const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return '';
    const z = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

function datetimeLocalToServer(local: string): string | null {
    const t = local.trim();
    if (!t) return null;
    const m = t.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (!m) return null;
    return `${m[1]} ${m[2]}:00`;
}

export default function Index({ notices, initialDrafts }: { notices?: NoticesProp; initialDrafts?: boolean }) {
    const { props } = usePage<PageProps>();
    const isAdmin = (props.auth?.user?.role ?? 'general') === 'admin';

    const list = notices?.data ?? [];

    const [items, setItems] = useState<Notice[]>(list);
    const [drawerId, setDrawerId] = useState<number | null>(null);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [q, setQ] = useState<string>('');
    const [draftTitle, setDraftTitle] = useState<string>('');
    const [draftBody, setDraftBody] = useState<string>('');
    const [draftPinned, setDraftPinned] = useState<boolean>(false);
    /** datetime-local 用（業務依頼の日付欄と同型） */
    const [draftPublishedLocal, setDraftPublishedLocal] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [draftsOnly, setDraftsOnly] = useState<boolean>(() => !!initialDrafts);
    const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

    const [readToggleId, setReadToggleId] = useState<number | null>(null);

    const api = useMemo(() => {
        return {
            index: (query: string, drafts: boolean) => {
                const p = new URLSearchParams();
                if (query.trim()) p.set('q', query.trim());
                if (drafts) p.set('drafts', '1');
                const qs = p.toString() ? `?${p.toString()}` : '';
                return fetch(`${route('portal.api.notices.index')}${qs}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
            },
            show: (id: number) =>
                fetch(route('portal.api.notices.show', { id }), {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                }),
            store: (payload: {
                title: string;
                body: string;
                is_pinned: boolean;
                published_at?: string | null;
            }) =>
                fetch(route('portal.api.notices.store'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(payload),
                }),
            update: (id: number, payload: { title?: string; body?: string; is_pinned?: boolean; published_at?: string | null }) =>
                fetch(route('portal.api.notices.update', { id }), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(payload),
                }),
            destroy: (id: number) =>
                fetch(route('portal.api.notices.destroy', { id }), {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                }),
            read: (id: number) =>
                fetch(route('portal.api.notices.read', { id }), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                }),
            unread: (id: number) =>
                fetch(route('portal.api.notices.unread', { id }), {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                }),
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        api.index('', draftsOnly)
            .then(async (res) => {
                if (!res.ok) return;
                const json = (await res.json()) as unknown;
                const rows = Array.isArray(json)
                    ? (json as Notice[])
                    : json && typeof json === 'object' && Array.isArray((json as { data?: unknown }).data)
                      ? ((json as { data: Notice[] }).data as Notice[])
                      : [];
                if (mounted) setItems(rows);
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, [api, draftsOnly]);

    useEffect(() => {
        setItems(notices?.data ?? []);
    }, [notices]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('open');
        const id = raw ? Number(raw) : NaN;
        if (!Number.isFinite(id) || id <= 0) return;
        void openDetail(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const markReadServer = async (id: number) => {
        try {
            const res = await api.read(id);
            if (!res.ok) return;
            setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
            setSelectedNotice((n) => (n && n.id === id ? { ...n, is_read: true } : n));
        } catch {
            /* ignore */
        }
    };

    const markUnreadServer = async (id: number) => {
        try {
            const res = await api.unread(id);
            if (!res.ok) return;
            setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: false } : x)));
            setSelectedNotice((n) => (n && n.id === id ? { ...n, is_read: false } : n));
        } catch {
            /* ignore */
        }
    };

    const toggleNoticeReadInList = async (n: Notice) => {
        setReadToggleId(n.id);
        try {
            if (n.is_read) await markUnreadServer(n.id);
            else await markReadServer(n.id);
        } finally {
            setReadToggleId(null);
        }
    };

    const openCreate = () => {
        setIsCreating(true);
        setDrawerId(null);
        setSelectedNotice(null);
        setDraftTitle('');
        setDraftBody('');
        setDraftPinned(false);
        setDraftPublishedLocal('');
        setErrorMessage(null);
        setSuccessMessage(null);
    };

    const openDetail = async (id: number) => {
        setIsCreating(false);
        setDrawerId(id);
        setSelectedNotice(null);
        setIsDetailLoading(true);
        setErrorMessage(null);
        try {
            const res = await api.show(id);
            if (!res.ok) throw new Error();
            const json = (await res.json()) as any;
            const n = (json?.data ?? json) as Notice;
            setSelectedNotice(n);
            setDraftTitle(n?.title ?? '');
            setDraftBody(n?.body ?? '');
            setDraftPinned(!!n?.is_pinned);
            setDraftPublishedLocal(isoToDatetimeLocal(n?.published_at ?? null));
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
                                        const res = await api.index(q, draftsOnly);
                                        if (!res.ok) throw new Error();
                                        const json = (await res.json()) as unknown;
                                        const rows = Array.isArray(json)
                                            ? (json as Notice[])
                                            : json && typeof json === 'object' && Array.isArray((json as { data?: unknown }).data)
                                              ? ((json as { data: Notice[] }).data as Notice[])
                                              : [];
                                        setItems(rows);
                                    } catch {
                                        setErrorMessage('検索に失敗しました。');
                                    }
                                }}
                                className={btnGhost}
                            >
                                検索
                            </button>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={unreadOnly}
                                    onChange={(e) => setUnreadOnly(e.target.checked)}
                                    className="rounded-sm border-wa-accent/35 text-wa-accent"
                                />
                                <span className="text-xs font-semibold text-wa-body">未読のみ表示</span>
                            </label>
                            <p className="text-[10px] text-wa-muted">PIN 固定の項目は常に最上部に表示されます</p>
                            <ActionButton className="w-full" disabled={!isAdmin} onClick={openCreate}>
                                新規作成（管理者）
                            </ActionButton>
                            <button
                                type="button"
                                className={btnGhost}
                                onClick={() => router.visit(draftsOnly ? route('notices.index') : route('notices.drafts'))}
                            >
                                {draftsOnly ? '一覧へ戻る' : '下書き'}
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

                            {isCreating && isAdmin ? (
                                <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-4">
                                    <div className="text-xs font-bold tracking-widest text-wa-muted">
                                        CREATE
                                    </div>
                                    <div className="mt-1 text-[11px] text-wa-muted">
                                        新規作成フォーム
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
                                        <NoticeMetaFields
                                            pinned={draftPinned}
                                            onPinnedChange={setDraftPinned}
                                            publishedLocal={draftPublishedLocal}
                                            onPublishedLocalChange={setDraftPublishedLocal}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={async () => {
                                                    if (!draftTitle.trim()) {
                                                        setErrorMessage('タイトルを入力してください');
                                                        return;
                                                    }
                                                    setIsSaving(true);
                                                    setErrorMessage(null);
                                                    setSuccessMessage(null);
                                                    try {
                                                        const res = await api.store({
                                                            title: draftTitle,
                                                            body: draftBody,
                                                            is_pinned: draftPinned,
                                                            published_at: null,
                                                        });
                                                        if (!res.ok) throw new Error();
                                                        const json = (await res.json()) as any;
                                                        const n = (json?.data ?? json) as Notice;
                                                        setItems((prev) => [n, ...prev]);
                                                        setSuccessMessage('下書きを保存しました。');
                                                        setIsCreating(false);
                                                    } catch {
                                                        setErrorMessage('保存に失敗しました。');
                                                    } finally {
                                                        setIsSaving(false);
                                                    }
                                                }}
                                                className="flex-1 rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-3 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40 disabled:opacity-40"
                                            >
                                                {isSaving ? '保存中…' : '下書き保存'}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={async () => {
                                                    if (!draftTitle.trim()) {
                                                        setErrorMessage('タイトルを入力してください');
                                                        return;
                                                    }
                                                    setIsSaving(true);
                                                    setErrorMessage(null);
                                                    setSuccessMessage(null);
                                                    try {
                                                        const pub = datetimeLocalToServer(draftPublishedLocal) || formatNaiveNow();
                                                        const res = await api.store({
                                                            title: draftTitle,
                                                            body: draftBody,
                                                            is_pinned: draftPinned,
                                                            published_at: pub,
                                                        });
                                                        if (!res.ok) throw new Error();
                                                        const json = (await res.json()) as any;
                                                        const n = (json?.data ?? json) as Notice;
                                                        setItems((prev) => [n, ...prev]);
                                                        setSuccessMessage('公開しました。');
                                                        setIsCreating(false);
                                                    } catch {
                                                        setErrorMessage('保存に失敗しました。');
                                                    } finally {
                                                        setIsSaving(false);
                                                    }
                                                }}
                                                className="flex-1 rounded-xl border border-wa-accent/40 bg-wa-accent px-3 py-3 text-xs font-black text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-40"
                                            >
                                                {isSaving ? '保存中…' : '公開'}
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCreating(false);
                                                setDrawerId(null);
                                                setSelectedNotice(null);
                                                setDraftTitle('');
                                                setDraftBody('');
                                                setDraftPinned(false);
                                                setDraftPublishedLocal('');
                                                setErrorMessage(null);
                                                setSuccessMessage(null);
                                            }}
                                            className="w-full rounded-sm border border-wa-accent/20 bg-wa-card px-4 py-2 text-xs font-black tracking-widest text-wa-muted transition hover:border-wa-accent/35 hover:text-wa-body"
                                        >
                                            CLOSE
                                        </button>
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
                            <div className="text-xs font-semibold text-wa-accent">{items.length} 件</div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {[...items]
                                .filter((n) => !unreadOnly || !n.is_read)
                                .sort((a, b) => {
                                if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
                                return 0;
                            }).map((n) => (
                                <NoticeFeedItem
                                    key={n.id}
                                    title={n.title}
                                    body={n.body}
                                    publishedAt={n.published_at ?? undefined}
                                    isPinned={n.is_pinned}
                                    isRead={!!n.is_read}
                                    onOpen={() => openDetail(n.id)}
                                    onToggleRead={() => void toggleNoticeReadInList(n)}
                                    readToggleBusy={readToggleId === n.id}
                                />
                            ))}
                        </div>
                    </NeonCard>
                </div>
            </div>

            <DetailDrawer
                open={drawerId !== null}
                title={
                    isDetailLoading
                        ? '読み込み中…'
                        : isAdmin && selectedNotice
                          ? 'お知らせを編集'
                          : (selectedNotice?.title ?? '周知事項')
                }
                onClose={() => {
                    setDrawerId(null);
                    setSelectedNotice(null);
                    setIsDetailLoading(false);
                }}
            >
                {isDetailLoading ? (
                    <div className="rounded-sm border border-wa-accent/20 bg-wa-card px-4 py-6 text-sm text-wa-muted">
                        読み込み中…
                    </div>
                ) : selectedNotice && isAdmin ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-wa-accent/20 bg-wa-ink px-4 py-4">
                            <div className="text-[11px] font-bold tracking-widest text-wa-muted">お知らせの編集</div>
                            <div className="mt-3 space-y-3">
                                <input
                                    type="text"
                                    value={draftTitle}
                                    onChange={(e) => setDraftTitle(e.target.value)}
                                    className="nordic-field"
                                    placeholder="タイトル（最大100）"
                                />
                                <textarea
                                    rows={8}
                                    value={draftBody}
                                    onChange={(e) => setDraftBody(e.target.value)}
                                    className="nordic-field min-h-[160px]"
                                    placeholder="本文（最大10000）"
                                />
                                <NoticeMetaFields
                                    pinned={draftPinned}
                                    onPinnedChange={setDraftPinned}
                                    publishedLocal={draftPublishedLocal}
                                    onPublishedLocalChange={setDraftPublishedLocal}
                                />
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={async () => {
                                            if (!drawerId) return;
                                            if (!draftTitle.trim()) {
                                                setErrorMessage('タイトルを入力してください');
                                                return;
                                            }
                                            setIsSaving(true);
                                            setErrorMessage(null);
                                            setSuccessMessage(null);
                                            try {
                                                const res = await api.update(drawerId, {
                                                    title: draftTitle,
                                                    body: draftBody,
                                                    is_pinned: draftPinned,
                                                    published_at: null,
                                                });
                                                if (!res.ok) throw new Error();
                                                const json = (await res.json()) as any;
                                                const n = (json?.data ?? json) as Notice;
                                                setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
                                                setSelectedNotice(n);
                                                setDraftPublishedLocal(isoToDatetimeLocal(n.published_at));
                                                setSuccessMessage('下書きにしました。');
                                            } catch {
                                                setErrorMessage('保存に失敗しました。');
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        className="w-full rounded-xl border border-wa-accent/25 bg-wa-card px-4 py-3 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40 sm:flex-1"
                                    >
                                        {isSaving ? '保存中…' : '下書き保存'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={async () => {
                                            if (!drawerId) return;
                                            if (!draftTitle.trim()) {
                                                setErrorMessage('タイトルを入力してください');
                                                return;
                                            }
                                            setIsSaving(true);
                                            setErrorMessage(null);
                                            setSuccessMessage(null);
                                            try {
                                                const pub = datetimeLocalToServer(draftPublishedLocal) || formatNaiveNow();
                                                const res = await api.update(drawerId, {
                                                    title: draftTitle,
                                                    body: draftBody,
                                                    is_pinned: draftPinned,
                                                    published_at: pub,
                                                });
                                                if (!res.ok) throw new Error();
                                                const json = (await res.json()) as any;
                                                const n = (json?.data ?? json) as Notice;
                                                setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
                                                setSelectedNotice(n);
                                                setDraftPublishedLocal(isoToDatetimeLocal(n.published_at));
                                                setSuccessMessage('公開設定を更新しました。');
                                            } catch {
                                                setErrorMessage('保存に失敗しました。');
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        className="w-full rounded-xl border border-wa-accent/40 bg-wa-accent px-4 py-3 text-xs font-black text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-40 sm:flex-1"
                                    >
                                        {isSaving ? '保存中…' : '公開として保存'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {drawerId !== null ? (
                            <div className="rounded-sm border border-red-500/30 bg-red-950/25 px-4 py-4">
                                <div className="text-[11px] font-bold uppercase tracking-widest text-red-200">Danger zone</div>
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={async () => {
                                        if (!window.confirm('このお知らせを削除しますか？取り消せません。')) return;
                                        setIsSaving(true);
                                        setErrorMessage(null);
                                        try {
                                            const res = await api.destroy(drawerId);
                                            if (!res.ok && res.status !== 204) throw new Error();
                                            setItems((prev) => prev.filter((x) => x.id !== drawerId));
                                            setDrawerId(null);
                                            setSelectedNotice(null);
                                            setSuccessMessage('削除しました。');
                                            window.setTimeout(() => setSuccessMessage(null), 1600);
                                        } catch {
                                            setErrorMessage('削除に失敗しました。');
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    className="mt-3 w-full rounded-sm border border-red-500/45 bg-wa-ink px-4 py-3 text-xs font-black tracking-widest text-red-200 transition hover:border-red-400 hover:bg-red-950/40 disabled:opacity-40"
                                >
                                    {isSaving ? '処理中…' : 'このお知らせを削除'}
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : selectedNotice ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedNotice.is_pinned ? <StatusBadge variant="primary" pulse>PIN</StatusBadge> : null}
                            <div className="text-base font-black tracking-tight text-wa-body">{selectedNotice.title}</div>
                        </div>
                        <div className="text-xs text-wa-muted">
                            {selectedNotice.published_at ? `公開: ${selectedNotice.published_at}` : '下書き（未公開）'}
                        </div>
                        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-3">
                            <div className="text-[11px] font-bold tracking-widest text-wa-muted">本文</div>
                            <div className="wa-wrap-anywhere mt-2 whitespace-pre-wrap text-sm text-wa-body">
                                {selectedNotice.body}
                            </div>
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
