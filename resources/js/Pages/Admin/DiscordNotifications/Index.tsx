import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import NordicCard from '@/Components/UI/NordicCard';
import StatusBadge from '@/Components/StatusBadge';
import JsonCodeBlock from '@/Components/JsonCodeBlock';

type LogRow = {
    id: number;
    parent_id: number | null;
    event_type: string;
    status_code: number | null;
    error_message: string | null;
    triggered_by: number | null;
    created_at: string;
};

type LogDetail = LogRow & {
    payload: unknown;
    response_body: string | null;
    updated_at: string;
};

function formatLogAt(raw: string | null | undefined): string {
    if (!raw) return '—';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return (
        d.toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }) + ' JST'
    );
}

function httpBadge(code: number | null): { variant: 'success' | 'danger' | 'muted'; label: string } {
    if (code !== null && code >= 200 && code < 300) {
        return { variant: 'success', label: String(code) };
    }
    if (code === null) {
        return { variant: 'muted', label: '未送信' };
    }
    return { variant: 'danger', label: String(code) };
}

const filterField = 'nordic-field py-2 text-xs font-semibold tracking-tight';

function csrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

export default function Index() {
    const [items, setItems] = useState<LogRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [filterEventType, setFilterEventType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const PAGE_SIZE = 20;
    const [currentPage, setCurrentPage] = useState(0);
    const [isRetryingId, setIsRetryingId] = useState<number | null>(null);
    const [detailId, setDetailId] = useState<number | null>(null);
    const [detail, setDetail] = useState<LogDetail | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

    const api = useMemo(() => {
        return {
            index: (params: { event_type?: string; status?: string; date_from?: string; date_to?: string }) => {
                const qs = new URLSearchParams();
                if (params.event_type) qs.set('event_type', params.event_type);
                if (params.status) qs.set('status', params.status);
                if (params.date_from) qs.set('date_from', params.date_from);
                if (params.date_to) qs.set('date_to', params.date_to);
                const url = `${route('portal.api.discord-notifications.index')}?${qs.toString()}`;
                return fetch(url, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
            },
            show: (id: number) =>
                fetch(route('portal.api.discord-notifications.show', { id }), {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                }),
            retry: (id: number) =>
                fetch(route('portal.api.discord-notifications.retry', { id }), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrf(),
                    },
                    credentials: 'same-origin',
                }),
        };
    }, []);

    const load = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const res = await api.index({
                event_type: filterEventType || undefined,
                status: filterStatus || undefined,
                date_from: filterDateFrom || undefined,
                date_to: filterDateTo || undefined,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as unknown;
            const rows = Array.isArray(json)
                ? (json as LogRow[])
                : json && typeof json === 'object' && 'data' in json && Array.isArray((json as { data: unknown }).data)
                  ? ((json as { data: LogRow[] }).data as LogRow[])
                  : [];
            setItems(rows);
            setCurrentPage(0);
        } catch {
            setErrorMessage('ログ一覧の取得に失敗しました。再読み込みしてください。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const uniqueEventTypes = useMemo(() => {
        const set = new Set(items.map((x) => x.event_type));
        return Array.from(set).sort();
    }, [items]);

    const ghostBtn =
        'rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-2 text-xs font-semibold tracking-tight text-wa-body transition hover:border-wa-accent/40 hover:bg-wa-card disabled:opacity-50';

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-semibold tracking-tight text-wa-body">Discord 通知ログ</h2>}>
            <Head title="Discord通知ログ（管理者）" />
            <div className="mx-auto max-w-6xl text-wa-body wa-body-track">
                <NordicCard elevate={false} className="p-8">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">一覧</div>
                            <div className="mt-2 text-xl font-semibold tracking-tight text-wa-body">Discord 通知（監査表示）</div>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-wa-muted">
                                Webhook 送信履歴です。外部連携の監査ログ画面と同じトーンで一覧化しています。行末から詳細・再送できます。
                            </p>
                        </div>
                        <div className="rounded-full border border-teal-500/35 bg-wa-ink px-4 py-2 text-sm font-medium text-teal-300 ring-1 ring-teal-500/20">
                            {items.length} 件（表示中）
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        <select
                            value={filterEventType}
                            onChange={(e) => setFilterEventType(e.target.value)}
                            className={filterField}
                        >
                            <option value="">イベント: すべて</option>
                            {uniqueEventTypes.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={filterField}>
                            <option value="">ステータス: すべて</option>
                            <option value="success">成功（2xx）</option>
                            <option value="failed">失敗・未送信など</option>
                        </select>
                        <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} placeholder="2025-05-01" className={filterField} />
                        <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} placeholder="2025-12-31" className={filterField} />
                        <button
                            type="button"
                            onClick={() => void load()}
                            className="rounded-sm border border-wa-accent/45 bg-wa-accent px-3 py-2 text-xs font-semibold tracking-tight text-wa-ink shadow-sm ring-1 ring-wa-accent/30 transition hover:bg-wa-accent/90"
                        >
                            再読込
                        </button>
                    </div>

                    {errorMessage ? (
                        <div className="mt-4 rounded-sm border border-red-500/35 bg-wa-ink px-4 py-3 text-xs text-red-300">
                            {errorMessage}
                        </div>
                    ) : null}
                    {successMessage ? (
                        <div className="mt-4 rounded-sm border border-teal-500/35 bg-wa-ink px-4 py-3 text-xs text-teal-300">
                            {successMessage}
                        </div>
                    ) : null}

                    <div className="mt-8 overflow-hidden rounded-sm border border-wa-accent/20 bg-wa-ink">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-wa-card text-xs font-semibold uppercase tracking-wider text-wa-muted">
                                <tr>
                                    <th className="px-5 py-4">実行日時（JST）</th>
                                    <th className="px-5 py-4">イベント</th>
                                    <th className="px-5 py-4">HTTP</th>
                                    <th className="px-5 py-4">ID</th>
                                    <th className="px-5 py-4">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-wa-accent/15 bg-wa-card">
                                {isLoading ? (
                                    <tr>
                                        <td className="px-5 py-8 text-sm text-wa-muted" colSpan={5}>
                                            読み込み中…
                                        </td>
                                    </tr>
                                ) : items.length ? (
                                    items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((x) => {
                                        const hb = httpBadge(x.status_code);
                                        const canRetry = x.status_code === null || x.status_code >= 300;
                                        return (
                                            <tr key={x.id} className="transition-colors hover:bg-wa-ink/80">
                                                <td className="px-5 py-4 font-mono text-xs text-wa-muted">{formatLogAt(x.created_at)}</td>
                                                <td className="px-5 py-4 font-medium text-wa-body">
                                                    <div className="wa-wrap-anywhere">{x.event_type}</div>
                                                    {x.error_message ? (
                                                        <div className="mt-1 text-[11px] text-red-400">{x.error_message}</div>
                                                    ) : null}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge variant={hb.variant}>{hb.label}</StatusBadge>
                                                </td>
                                                <td className="px-5 py-4 font-mono text-xs text-wa-muted">
                                                    {x.id}
                                                    {x.parent_id ? (
                                                        <span className="ml-2 text-[10px] text-wa-muted">↳ {x.parent_id}</span>
                                                    ) : null}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            setDetailId(x.id);
                                                            setDetail(null);
                                                            setIsDetailLoading(true);
                                                            setErrorMessage(null);
                                                            try {
                                                                const res = await api.show(x.id);
                                                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                                                const json = (await res.json()) as LogDetail;
                                                                setDetail(json);
                                                            } catch {
                                                                setErrorMessage('詳細の取得に失敗しました。');
                                                            } finally {
                                                                setIsDetailLoading(false);
                                                            }
                                                        }}
                                                        className={`${ghostBtn} mr-2`}
                                                    >
                                                        詳細
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!canRetry || isRetryingId === x.id}
                                                        onClick={async () => {
                                                            setIsRetryingId(x.id);
                                                            setErrorMessage(null);
                                                            setSuccessMessage(null);
                                                            try {
                                                                const res = await api.retry(x.id);
                                                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                                                setSuccessMessage('再送をキューに投入しました。');
                                                                await load();
                                                            } catch {
                                                                setErrorMessage('再送に失敗しました。');
                                                            } finally {
                                                                setIsRetryingId(null);
                                                            }
                                                        }}
                                                        className={ghostBtn}
                                                    >
                                                        {isRetryingId === x.id ? '再送中…' : '再送'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td className="px-5 py-10 text-center text-sm text-wa-muted" colSpan={5}>
                                            ログがありません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {items.length > PAGE_SIZE && (
                        <div className="mt-4 flex items-center justify-between gap-2">
                            <span className="text-xs text-wa-muted">
                                {currentPage * PAGE_SIZE + 1}〜{Math.min((currentPage + 1) * PAGE_SIZE, items.length)} / {items.length} 件
                            </span>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    className={`${ghostBtn} disabled:opacity-30`}
                                >
                                    ← 前
                                </button>
                                <button
                                    type="button"
                                    disabled={(currentPage + 1) * PAGE_SIZE >= items.length}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    className={`${ghostBtn} disabled:opacity-30`}
                                >
                                    次 →
                                </button>
                            </div>
                        </div>
                    )}
                </NordicCard>
            </div>

            {detailId !== null ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-wa-ink/75 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-3xl overflow-hidden rounded-sm border border-wa-accent/25 bg-wa-card shadow-xl shadow-black/50 ring-1 ring-wa-accent/10">
                        <div className="flex items-center justify-between border-b border-wa-accent/20 bg-wa-ink px-5 py-4">
                            <div className="text-sm font-semibold tracking-tight text-wa-body">詳細 #{detailId}</div>
                            <button
                                type="button"
                                onClick={() => {
                                    setDetailId(null);
                                    setDetail(null);
                                    setIsDetailLoading(false);
                                }}
                                className={ghostBtn}
                            >
                                閉じる
                            </button>
                        </div>
                        <div className="max-h-[70vh] space-y-4 overflow-auto p-5 text-sm text-wa-body">
                            {isDetailLoading ? (
                                <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-6 text-sm text-wa-muted">
                                    読み込み中…
                                </div>
                            ) : detail ? (
                                <>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-3">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">イベント</div>
                                            <div className="mt-1 text-wa-body">{detail.event_type}</div>
                                        </div>
                                        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-3">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">HTTP</div>
                                            <div className="mt-1">
                                                <StatusBadge variant={httpBadge(detail.status_code).variant}>
                                                    {httpBadge(detail.status_code).label}
                                                </StatusBadge>
                                            </div>
                                        </div>
                                        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-3 sm:col-span-2">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">実行日時（JST）</div>
                                            <div className="mt-1 font-mono text-xs text-wa-body">
                                                {formatLogAt(detail.created_at)}
                                                {detail.updated_at && detail.updated_at !== detail.created_at ? (
                                                    <span className="ml-2 text-wa-muted">（更新 {formatLogAt(detail.updated_at)}）</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-5">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">ペイロード</div>
                                        <div className="mt-3">
                                            <JsonCodeBlock value={detail.payload} theme="light" />
                                        </div>
                                    </div>

                                    <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-5">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">レスポンス</div>
                                        <div className="mt-3">
                                            <JsonCodeBlock value={detail.response_body ?? '—'} theme="light" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-sm border border-wa-accent/20 bg-wa-card px-4 py-6 text-sm text-wa-muted">
                                    データがありません
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
    );
}
