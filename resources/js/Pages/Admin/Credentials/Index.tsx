import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import NeonCard from '@/Components/NeonCard';

type Credential = {
    id: number;
    label: string;
    value: string;
    masked_value: string;
    is_password: boolean;
    updated_at: string; // "Y-m-d H:i:s"
};

const ghostBtn =
    'rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-xs font-black tracking-tight text-stone-700 shadow-sm transition hover:bg-emerald-50/50';

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
            <div className="mx-auto max-w-6xl px-6 py-6 text-stone-800">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard elevate={false}>
                        <div className="text-xs font-bold tracking-widest text-stone-500">RULES</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-stone-900">運用ルール</div>
                        <ul className="mt-4 space-y-2 text-xs text-stone-600">
                            <li>・値は初期表示マスク（パスワード系）</li>
                            <li>・編集は 1件ずつ（同時編集ガードは後続で実装）</li>
                            <li>・保存は GAS 連携を想定（現状はUIのみ）</li>
                        </ul>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2" elevate={false}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-stone-500">LIST</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-stone-900">ID / パス一覧</div>
                            </div>
                            <div className="text-xs text-stone-500">全 {items.length} 件</div>
                        </div>

                        {errorMessage ? (
                            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                                {errorMessage}
                            </div>
                        ) : null}
                        {successMessage ? (
                            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                                {successMessage}
                            </div>
                        ) : null}

                        <div className="mt-4 space-y-3">
                            {isLoading ? (
                                <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-6 text-sm text-stone-500">
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
                                            className="rounded-xl border border-stone-200 bg-white/70 px-4 py-4 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-black tracking-tight text-stone-900">
                                                        {c.label}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-stone-500">updated_at: {c.updated_at}</div>
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
                                                            className={ghostBtn}
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
                                                        className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-black tracking-tight text-white shadow-sm ring-1 ring-emerald-500/25 transition hover:from-emerald-500/95 hover:to-emerald-600/95"
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
                                                            className="nordic-field min-h-[80px]"
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
                                                                className={ghostBtn + ' px-4 py-2.5 text-sm'}
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
                                                                            setErrorMessage(
                                                                                '他のユーザーによって更新されました。画面を再読み込みしてください。',
                                                                            );
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
                                                                className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-black tracking-tight text-white shadow-sm ring-1 ring-emerald-500/25 transition hover:from-emerald-500/95 hover:to-emerald-600/95 disabled:opacity-50"
                                                            >
                                                                {isSaving ? 'SAVING…' : 'SAVE'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 font-mono text-xs text-stone-800">
                                                        {displayValue || '—'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </NeonCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
