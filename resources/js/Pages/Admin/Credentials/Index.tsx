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
    is_mock?: boolean;
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
        if (c.is_mock) {
            setToast('サンプルは編集できません');
            return;
        }
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
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">CREDENTIALS</h2>}>
            <Head title="ID / パス" />

            <div className="mx-auto max-w-3xl px-4 py-8 text-wa-body wa-body-track">
                {errorMessage ? (
                    <div className="mb-4 rounded-sm border border-red-500/35 bg-wa-ink px-3 py-2 text-sm text-red-300">{errorMessage}</div>
                ) : null}
                {toast ? (
                    <div className="mb-4 rounded-sm border border-teal-500/35 bg-wa-ink px-3 py-2 text-sm text-teal-300">{toast}</div>
                ) : null}

                {isLoading ? <div className="py-16 text-center text-sm text-wa-muted">読み込み中</div> : null}

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
                                    className="rounded-sm border border-wa-accent/20 bg-wa-card px-4 py-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-3">
                                            <div>
                                                <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
                                                    サービス名
                                                </div>
                                                <div className="truncate text-base font-semibold text-wa-body">{c.service_name}</div>
                                            </div>

                                            {isEditing ? (
                                                <>
                                                    <div>
                                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
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
                                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
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
                                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
                                                            ログインID
                                                        </div>
                                                        <div className="font-mono text-sm text-wa-body">{c.login_id || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
                                                                パスワード
                                                            </span>
                                                            {c.is_password ? (
                                                                <button
                                                                    type="button"
                                                                    className="select-none rounded-sm border border-wa-accent/25 bg-wa-ink px-2 py-0.5 text-xs leading-none text-wa-muted transition hover:border-wa-accent/40 hover:text-wa-body"
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
                                                        <div className="mt-1 break-all font-mono text-sm text-wa-body">
                                                            {passwordDisplay}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <div className="text-[10px] text-wa-muted">{c.updated_at}</div>
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-1.5 text-xs font-medium text-wa-body transition hover:border-wa-accent/40"
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
                                                        className="rounded-sm border border-wa-accent/45 bg-wa-accent px-3 py-1.5 text-xs font-medium text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-50"
                                                    >
                                                        {isSaving ? '保存中…' : '保存'}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => beginEdit(c)}
                                                    disabled={!!c.is_mock}
                                                    className="rounded-sm border border-wa-accent/45 bg-wa-accent px-3 py-1.5 text-xs font-medium text-wa-ink transition hover:bg-wa-accent/90"
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
