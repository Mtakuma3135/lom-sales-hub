import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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

export default function Index({ notices }: { notices?: NoticesProp }) {
    const { props } = usePage<{ auth?: { user?: { role?: string } } }>();
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

    const openCreate = () => {
        setIsCreating(true);
        setSelectedId(null);
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

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">NOTICE / FEED</h2>}>
            <Head title="周知事項" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* 左：フィルタカード */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">FILTER</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-white">絞り込み</div>
                        <div className="mt-4 space-y-3">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="キーワード検索"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
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
                                className="w-full rounded-2xl bg-white/5 px-3 py-3 text-sm font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                            >
                                検索
                            </button>
                            <div className="rounded-xl border border-white/10 bg-[#0b1020]/60 px-3 py-3 text-xs text-white/65">
                                PIN は常に最上部に表示されます
                            </div>
                            <button
                                type="button"
                                disabled={!isAdmin}
                                onClick={openCreate}
                                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-3 py-3 text-sm font-black tracking-tight text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110 disabled:opacity-40"
                            >
                                新規作成（管理者）
                            </button>
                            <button
                                type="button"
                                className="w-full rounded-2xl bg-white/5 px-3 py-3 text-sm font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                            >
                                下書き
                            </button>

                            {errorMessage ? (
                                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100/80">
                                    {errorMessage}
                                </div>
                            ) : null}
                            {successMessage ? (
                                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100/80">
                                    {successMessage}
                                </div>
                            ) : null}

                            {(isCreating || selectedId !== null) && isAdmin ? (
                                <div className="rounded-2xl border border-white/10 bg-[#0b1020]/55 p-4">
                                    <div className="text-xs font-bold tracking-widest text-white/60">
                                        {isCreating ? 'CREATE' : 'EDIT'}
                                    </div>
                                    <div className="mt-3 space-y-3">
                                        <input
                                            value={draftTitle}
                                            onChange={(e) => setDraftTitle(e.target.value)}
                                            placeholder="タイトル（最大100）"
                                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                                        />
                                        <textarea
                                            value={draftBody}
                                            onChange={(e) => setDraftBody(e.target.value)}
                                            rows={5}
                                            placeholder="本文（最大10000）"
                                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <label className="flex items-center gap-2 text-xs font-semibold text-white/70">
                                                <input
                                                    type="checkbox"
                                                    checked={draftPinned}
                                                    onChange={(e) => setDraftPinned(e.target.checked)}
                                                />
                                                PIN
                                            </label>
                                            <input
                                                value={draftPublishedAt}
                                                onChange={(e) => setDraftPublishedAt(e.target.value)}
                                                placeholder="published_at (YYYY-MM-DD HH:mm:ss)"
                                                className="w-48 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 transition-colors focus:bg-white focus:text-black"
                                            />
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCreating(false);
                                                    setSelectedId(null);
                                                    setDraftTitle('');
                                                    setDraftBody('');
                                                    setDraftPinned(false);
                                                    setDraftPublishedAt('');
                                                    setErrorMessage(null);
                                                    setSuccessMessage(null);
                                                }}
                                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/80 hover:bg-white/10"
                                            >
                                                CLOSE
                                            </button>
                                            <button
                                                type="button"
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
                                                className="rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2 text-xs font-black tracking-widest text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110 disabled:opacity-50"
                                            >
                                                {isSaving ? 'SAVING…' : 'SAVE'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* 右：一覧 */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">FEED</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">お知らせ</div>
                            </div>
                            <div className="text-xs font-semibold text-cyan-200/80">
                                {list.length} 件
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {items.map((n) => (
                                <div
                                    key={n.id}
                                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/50 px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_26px_rgba(168,85,247,0.18)]"
                                >
                                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-400/10" />
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="relative min-w-0">
                                            <div className="flex items-center gap-2">
                                                {n.is_pinned ? (
                                                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-500/25 to-cyan-400/20 px-2.5 py-1 text-[11px] font-black text-white ring-1 ring-inset ring-white/10 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                                                        PIN
                                                    </span>
                                                ) : null}
                                                <div className="truncate text-sm font-black tracking-tight text-white">
                                                    {n.title}
                                                </div>
                                            </div>
                                            <div className="mt-2 line-clamp-2 text-sm text-white/70">
                                                {n.body}
                                            </div>
                                            <div className="mt-2 text-xs text-white/45">
                                                公開: {n.published_at}
                                            </div>
                                        </div>

                                        <div className="relative flex shrink-0 flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(n.id)}
                                                className="rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                            >
                                                {isAdmin ? '編集' : '詳細'}
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                            >
                                                既読
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

