import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type Credential = {
    id: number;
    label: string;
    value: string;
    masked_value: string;
    is_password: boolean;
    updated_at: string; // "Y-m-d H:i:s"
};

export default function Index() {
    const [visibleIds, setVisibleIds] = useState<Record<number, boolean>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<string>('');
    const [items, setItems] = useState<Credential[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const mask = (v: string): string => {
        if (!v) return '';
        const n = Math.min(12, v.length);
        return '•'.repeat(n);
    };

    const api = useMemo(() => {
        return {
            index: () => fetch(route('portal.api.credentials.index'), { headers: { Accept: 'application/json' } }),
            update: (id: number, payload: { value: string; updated_at: string }) =>
                fetch(route('portal.api.credentials.update', { id }), {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload),
                }),
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        api.index()
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = (await res.json()) as unknown;
                const list = Array.isArray(json) ? (json as Credential[]) : [];
                if (mounted) setItems(list);
            })
            .catch(() => {
                if (mounted) setErrorMessage('一覧の取得に失敗しました。再読み込みしてください。');
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [api]);

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">CREDENTIALS</h2>}>
            <Head title="資格情報管理（管理者）" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">RULES</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-white">運用ルール</div>
                        <ul className="mt-4 space-y-2 text-xs text-white/55">
                            <li>・値は初期表示マスク（パスワード系）</li>
                            <li>・編集は 1件ずつ（同時編集ガードは後続で実装）</li>
                            <li>・保存は GAS 連携を想定（現状はUIのみ）</li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">LIST</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">
                                    ID / パス一覧
                                </div>
                            </div>
                            <div className="text-xs text-white/45">全 {items.length} 件</div>
                        </div>

                        {errorMessage ? (
                            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100/80">
                                {errorMessage}
                            </div>
                        ) : null}
                        {successMessage ? (
                            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100/80">
                                {successMessage}
                            </div>
                        ) : null}

                        <div className="mt-4 space-y-3">
                            {isLoading ? (
                                <div className="rounded-2xl border border-white/10 bg-[#0b1020]/55 px-4 py-6 text-sm text-white/40">
                                    読み込み中…
                                </div>
                            ) : null}

                            {!isLoading &&
                                items.map((c) => {
                                const isVisible = !!visibleIds[c.id];
                                const isEditing = editingId === c.id;
                                const displayValue = c.is_password && !isVisible ? mask(c.masked_value ?? c.value) : c.value;

                                return (
                                    <div
                                        key={c.id}
                                        className="rounded-2xl border border-white/10 bg-[#0b1020]/55 px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-black tracking-tight text-white">
                                                    {c.label}
                                                </div>
                                                <div className="mt-1 text-[11px] text-white/45">
                                                    updated_at: {c.updated_at}
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {c.is_password ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setVisibleIds((m) => ({
                                                                ...m,
                                                                [c.id]: !m[c.id],
                                                            }))
                                                        }
                                                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 hover:bg-white/10"
                                                    >
                                                        {isVisible ? 'HIDE' : 'SHOW'}
                                                    </button>
                                                ) : null}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isEditing) {
                                                            setEditingId(null);
                                                            setDraft('');
                                                            setErrorMessage(null);
                                                            setSuccessMessage(null);
                                                            return;
                                                        }
                                                        setEditingId(c.id);
                                                        setDraft(c.value);
                                                        setErrorMessage(null);
                                                        setSuccessMessage(null);
                                                    }}
                                                    className="rounded-xl bg-gradient-to-r from-purple-500/30 to-cyan-400/20 px-3 py-2 text-xs font-black tracking-tight text-white shadow-[0_0_0_1px_rgba(34,211,238,0.14)] hover:brightness-110"
                                                >
                                                    {isEditing ? 'CLOSE' : 'EDIT'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={draft}
                                                        onChange={(e) => setDraft(e.target.value)}
                                                        rows={3}
                                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                                                    />
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setDraft('');
                                                                setErrorMessage(null);
                                                                setSuccessMessage(null);
                                                            }}
                                                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black tracking-tight text-white/80 hover:bg-white/10"
                                                        >
                                                            CANCEL
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isSaving}
                                                            onClick={async () => {
                                                                setIsSaving(true);
                                                                setErrorMessage(null);
                                                                setSuccessMessage(null);
                                                                try {
                                                                    const res = await api.update(c.id, {
                                                                        value: draft,
                                                                        updated_at: c.updated_at,
                                                                    });

                                                                    if (res.status === 409) {
                                                                        setErrorMessage('他のユーザーによって更新されました。画面を再読み込みしてください。');
                                                                        return;
                                                                    }
                                                                    if (!res.ok) {
                                                                        throw new Error(`HTTP ${res.status}`);
                                                                    }

                                                                    const json = (await res.json()) as any;
                                                                    const newUpdatedAt = (json?.updated_at as string) || c.updated_at;

                                                                    setItems((prev) =>
                                                                        prev.map((x) =>
                                                                            x.id === c.id
                                                                                ? {
                                                                                      ...x,
                                                                                      value: draft,
                                                                                      updated_at: newUpdatedAt,
                                                                                  }
                                                                                : x,
                                                                        ),
                                                                    );
                                                                    setSuccessMessage(
                                                                        json?.gas_synced
                                                                            ? '保存しました（GAS同期: OK）'
                                                                            : '保存しました（GAS同期: 失敗）',
                                                                    );
                                                                    setEditingId(null);
                                                                    setDraft('');
                                                                } catch {
                                                                    setErrorMessage('保存に失敗しました。再度送信してください。');
                                                                } finally {
                                                                    setIsSaving(false);
                                                                }
                                                            }}
                                                            className="rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2.5 text-sm font-black tracking-tight text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110 disabled:opacity-50"
                                                        >
                                                            {isSaving ? 'SAVING…' : 'SAVE'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-white/80">
                                                    {displayValue || '—'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

