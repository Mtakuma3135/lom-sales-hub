import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type CredentialRow = {
    id: number;
    service_name: string;
    login_id: string;
    password: string;
    is_password: boolean;
    updated_at: string;
};

function parseListJson(json: unknown): CredentialRow[] {
    if (Array.isArray(json)) {
        return json as CredentialRow[];
    }
    if (json && typeof json === 'object' && 'data' in json) {
        const d = (json as { data: unknown }).data;
        if (Array.isArray(d)) {
            return d as CredentialRow[];
        }
    }

    return [];
}

function maskSecret(value: string): string {
    const n = Math.max(8, Math.min(16, value.length || 8));

    return '•'.repeat(n);
}

export default function Index() {
    const [pressingReveal, setPressingReveal] = useState<Record<number, boolean>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draftLogin, setDraftLogin] = useState('');
    const [draftPassword, setDraftPassword] = useState('');
    const [items, setItems] = useState<CredentialRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const api = useMemo(
        () => ({
            index: () => fetch(route('portal.api.credentials.index'), { headers: { Accept: 'application/json' } }),
            update: (id: number, body: { login_id: string; password: string; updated_at: string }) =>
                fetch(route('portal.api.credentials.update', { id }), {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(body),
                }),
        }),
        [],
    );

    const load = useCallback(() => {
        setIsLoading(true);
        setErrorMessage(null);
        api
            .index()
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = (await res.json()) as unknown;
                setItems(parseListJson(json));
            })
            .catch(() => {
                setErrorMessage('取得に失敗しました。');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [api]);

    useEffect(() => {
        load();
    }, [load]);

    const beginEdit = (c: CredentialRow) => {
        setEditingId(c.id);
        setDraftLogin(c.login_id ?? '');
        setDraftPassword(c.password ?? '');
        setErrorMessage(null);
        setToast(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraftLogin('');
        setDraftPassword('');
        setErrorMessage(null);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-stone-900">CREDENTIALS</h2>}>
            <Head title="ID / パス" />

            <div className="mx-auto max-w-3xl px-4 py-8 text-stone-900">
                {errorMessage ? (
                    <div className="mb-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{errorMessage}</div>
                ) : null}
                {toast ? (
                    <div className="mb-4 rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800">{toast}</div>
                ) : null}

                {isLoading ? <div className="py-16 text-center text-sm text-stone-500">読み込み中</div> : null}

                {!isLoading && (
                    <ul className="space-y-4">
                        {items.map((c) => {
                            const isEditing = editingId === c.id;
                            const showSecret = c.is_password && !!pressingReveal[c.id];
                            const passwordDisplay =
                                !c.is_password ? '—' : showSecret ? c.password || '—' : maskSecret(c.password);

                            return (
                                <li
                                    key={c.id}
                                    className="rounded-lg border border-stone-200 bg-white px-4 py-4 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-3">
                                            <div>
                                                <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                    サービス名
                                                </div>
                                                <div className="truncate text-base font-semibold text-stone-900">{c.service_name}</div>
                                            </div>

                                            {isEditing ? (
                                                <>
                                                    <div>
                                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                            ログインID
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={draftLogin}
                                                            onChange={(e) => setDraftLogin(e.target.value)}
                                                            className="nordic-field mt-1 block w-full text-sm"
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                            パスワード
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={draftPassword}
                                                            onChange={(e) => setDraftPassword(e.target.value)}
                                                            className="nordic-field mt-1 block w-full font-mono text-sm"
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                            ログインID
                                                        </div>
                                                        <div className="font-mono text-sm text-stone-800">{c.login_id || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                                パスワード
                                                            </span>
                                                            {c.is_password ? (
                                                                <button
                                                                    type="button"
                                                                    className="select-none rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs leading-none text-stone-600 hover:bg-stone-100"
                                                                    aria-label="押している間だけパスワードを表示"
                                                                    onMouseDown={() =>
                                                                        setPressingReveal((m) => ({ ...m, [c.id]: true }))
                                                                    }
                                                                    onMouseUp={() =>
                                                                        setPressingReveal((m) => ({ ...m, [c.id]: false }))
                                                                    }
                                                                    onMouseLeave={() =>
                                                                        setPressingReveal((m) => ({ ...m, [c.id]: false }))
                                                                    }
                                                                    onBlur={() =>
                                                                        setPressingReveal((m) => ({ ...m, [c.id]: false }))
                                                                    }
                                                                >
                                                                    👀
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-1 break-all font-mono text-sm text-stone-800">
                                                            {passwordDisplay}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <div className="text-[10px] text-stone-400">{c.updated_at}</div>
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                                    >
                                                        閉じる
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isSaving}
                                                        onClick={async () => {
                                                            setIsSaving(true);
                                                            setErrorMessage(null);
                                                            setToast(null);
                                                            try {
                                                                const res = await api.update(c.id, {
                                                                    login_id: draftLogin,
                                                                    password: draftPassword,
                                                                    updated_at: c.updated_at,
                                                                });
                                                                if (res.status === 409) {
                                                                    setErrorMessage('他で更新されています。再読み込みしてください。');
                                                                    return;
                                                                }
                                                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                                                const json = (await res.json()) as {
                                                                    data?: CredentialRow;
                                                                    gas_synced?: boolean;
                                                                };
                                                                const row = json.data;
                                                                const gasOk = json.gas_synced === true;
                                                                if (row) {
                                                                    setItems((prev) => prev.map((x) => (x.id === c.id ? row : x)));
                                                                } else {
                                                                    load();
                                                                }
                                                                setToast(gasOk ? '保存しました' : '保存しました（GAS 未応答）');
                                                                cancelEdit();
                                                            } catch {
                                                                setErrorMessage('保存に失敗しました。');
                                                            } finally {
                                                                setIsSaving(false);
                                                            }
                                                        }}
                                                        className="rounded bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                                                    >
                                                        {isSaving ? '保存中…' : '保存'}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => beginEdit(c)}
                                                    className="rounded bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
                                                >
                                                    編集
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
