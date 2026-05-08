import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import NeonCard from '@/Components/NeonCard';
import SectionHeader from '@/Components/UI/SectionHeader';
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
    return '\u2022'.repeat(n);
}

function csrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

export default function Index() {
    const [pressingReveal, setPressingReveal] = useState<Record<number, boolean>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draftLogin, setDraftLogin] = useState('');
    const [draftPassword, setDraftPassword] = useState('');
    const [items, setItems] = useState<CredentialRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [gasSyncing, setGasSyncing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const api = useMemo(
        () => ({
            index: () => fetch(route('portal.api.credentials.index'), { headers: { Accept: 'application/json' } }),
            syncFromGas: () =>
                fetch(route('portal.api.credentials.sync-from-gas'), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrf(),
                    },
                    credentials: 'same-origin',
                    body: '{}',
                }),
            update: (id: number, body: { login_id: string; password: string; updated_at: string }) =>
                fetch(route('portal.api.credentials.update', { id }), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(body),
                }),
        }),
        [],
    );

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(key);
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

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

    const onSyncFromGas = async () => {
        if (gasSyncing) return;
        setGasSyncing(true);
        setErrorMessage(null);
        setToast(null);
        try {
            const res = await api.syncFromGas();
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setToast('GAS 取り込みをバックグラウンドで開始しました。まもなく再読込します。');
            window.setTimeout(() => load(), 2500);
        } catch {
            setErrorMessage('GAS 同期の開始に失敗しました。');
        } finally {
            setGasSyncing(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">CREDENTIALS</h2>}>
            <Head title="ID / パス" />

            <div className="mx-auto max-w-6xl px-4 py-6 text-wa-body wa-body-track sm:px-6">
                {errorMessage ? (
                    <div className="mb-4 rounded-xl border border-red-500/35 bg-wa-ink px-4 py-3 text-sm text-red-300">
                        {errorMessage}
                    </div>
                ) : null}
                {toast ? (
                    <div className="mb-4 rounded-xl border border-teal-500/35 bg-wa-ink px-4 py-3 text-sm text-teal-300">
                        {toast}
                    </div>
                ) : null}

                <NeonCard elevate={false}>
                    <SectionHeader
                        eyebrow="CREDENTIALS"
                        title="ID / パス管理"
                        meta={!isLoading && items.length > 0 ? `${items.length} 件` : isLoading ? '読み込み中…' : ''}
                        action={{
                            label: gasSyncing ? '同期開始中…' : 'GASから取り込み',
                            onClick: () => void onSyncFromGas(),
                            variant: 'secondary',
                        }}
                    />

                    {isLoading ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="animate-pulse rounded-xl border border-wa-accent/10 bg-wa-card/40 p-4"
                                >
                                    <div className="mt-4 h-3 max-w-[40%] rounded bg-wa-accent/15" />
                                    <div className="mt-2 h-3 w-full rounded bg-wa-accent/10" />
                                    <div className="mt-2 h-3 max-w-[75%] rounded bg-wa-accent/10" />
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {!isLoading && items.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-8 text-center text-sm text-wa-muted">
                            登録されている情報はありません
                        </div>
                    ) : null}

                    {!isLoading && items.length > 0 ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((c) => {
                                const isEditing = editingId === c.id;
                                const showSecret = c.is_password && !!pressingReveal[c.id];
                                const passwordDisplay =
                                    !c.is_password ? '—' : showSecret ? c.password || '—' : maskSecret(c.password);

                                return (
                                    <div
                                        key={c.id}
                                        className="rounded-xl border border-wa-accent/15 bg-wa-card p-4 shadow-nordic"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 text-xs font-black tracking-tight text-wa-body">
                                                <span className="block truncate">{c.service_name}</span>
                                            </div>
                                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                                {!isEditing ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => beginEdit(c)}
                                                        className="rounded-lg border border-wa-accent/40 bg-wa-accent px-2.5 py-1 text-[10px] font-black tracking-tight text-wa-ink transition hover:bg-wa-accent/90"
                                                    >
                                                        編集
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>

                                        {isEditing ? (
                                            <div className="mt-3 space-y-3">
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
                                                <div className="flex flex-wrap justify-end gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="rounded-xl border border-wa-accent/20 bg-wa-ink px-3 py-2 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/35"
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
                                                                    setErrorMessage(
                                                                        '他で更新されています。再読み込みしてください。',
                                                                    );
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
                                                        className="rounded-xl border border-wa-accent/40 bg-wa-accent px-3 py-2 text-xs font-black tracking-tight text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-50"
                                                    >
                                                        {isSaving ? '保存中…' : '保存'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                <div>
                                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
                                                        ログインID
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5">
                                                        <span className="min-w-0 truncate font-mono text-sm text-wa-body">
                                                            {c.login_id || '—'}
                                                        </span>
                                                        {c.login_id ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(c.login_id, `login-${c.id}`)}
                                                                className="shrink-0 rounded-lg border border-wa-accent/15 px-2 py-1 text-[10px] text-wa-muted transition hover:border-wa-accent/30 hover:text-wa-body"
                                                            >
                                                                {copiedId === `login-${c.id}` ? 'OK' : 'copy'}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
                                                            パスワード
                                                        </span>
                                                        {c.is_password ? (
                                                            <button
                                                                type="button"
                                                                className="select-none rounded-lg border border-wa-accent/15 px-2 py-1 text-[10px] text-wa-muted transition hover:border-wa-accent/30 hover:text-wa-body"
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
                                                                hold
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5">
                                                        <span className="min-w-0 break-all font-mono text-sm text-wa-body">
                                                            {passwordDisplay}
                                                        </span>
                                                        {c.is_password && c.password ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(c.password, `pw-${c.id}`)}
                                                                className="shrink-0 rounded-lg border border-wa-accent/15 px-2 py-1 text-[10px] text-wa-muted transition hover:border-wa-accent/30 hover:text-wa-body"
                                                            >
                                                                {copiedId === `pw-${c.id}` ? 'OK' : 'copy'}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-2 text-right text-[10px] text-wa-muted">{c.updated_at}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </NeonCard>
            </div>
        </AuthenticatedLayout>
    );
}
