import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import NeonCard from '@/Components/NeonCard';

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

function statusBadge(statusCode: number | null): { label: string; className: string } {
    if (statusCode && statusCode >= 200 && statusCode < 300) {
        return { label: `OK ${statusCode}`, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
    }
    if (statusCode === null) {
        return { label: 'PENDING', className: 'border-stone-200 bg-stone-100 text-stone-600' };
    }
    return { label: `NG ${statusCode}`, className: 'border-rose-200 bg-rose-50 text-rose-800' };
}

const filterField = 'nordic-field py-2 text-xs font-black tracking-tight';

export default function Index() {
    const [items, setItems] = useState<LogRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [filterEventType, setFilterEventType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('failed');
    const [filterTriggeredBy, setFilterTriggeredBy] = useState<string>('');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const [isRetryingId, setIsRetryingId] = useState<number | null>(null);
    const [detailId, setDetailId] = useState<number | null>(null);
    const [detail, setDetail] = useState<LogDetail | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

    const api = useMemo(() => {
        return {
            index: (params: {
                event_type?: string;
                status?: string;
                triggered_by?: string;
                date_from?: string;
                date_to?: string;
            }) => {
                const qs = new URLSearchParams();
                if (params.event_type) qs.set('event_type', params.event_type);
                if (params.status) qs.set('status', params.status);
                if (params.triggered_by) qs.set('triggered_by', params.triggered_by);
                if (params.date_from) qs.set('date_from', params.date_from);
                if (params.date_to) qs.set('date_to', params.date_to);
                const url = `${route('portal.api.discord-notifications.index')}?${qs.toString()}`;
                return fetch(url, { headers: { Accept: 'application/json' } });
            },
            show: (id: number) => fetch(route('portal.api.discord-notifications.show', { id }), { headers: { Accept: 'application/json' } }),
            retry: (id: number) =>
                fetch(route('portal.api.discord-notifications.retry', { id }), {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
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
                triggered_by: filterTriggeredBy || undefined,
                date_from: filterDateFrom || undefined,
                date_to: filterDateTo || undefined,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as unknown;
            setItems(Array.isArray(json) ? (json as LogRow[]) : []);
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
        'rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-xs font-black tracking-tight text-stone-700 shadow-sm transition hover:bg-emerald-50/50 disabled:opacity-50';

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">DISCORD / AUDIT LOG</h2>}>
            <Head title="Discord通知ログ（管理者）" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-stone-800">
                <NeonCard elevate={false}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-stone-500">LIST</div>
                            <div className="mt-1 text-lg font-black tracking-tight text-stone-900">通知ログ</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={filterEventType}
                                onChange={(e) => setFilterEventType(e.target.value)}
                                className={filterField}
                            >
                                <option value="">EVENT: ALL</option>
                                {uniqueEventTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={filterField}>
                                <option value="">STATUS: ALL</option>
                                <option value="success">SUCCESS</option>
                                <option value="failed">FAILED/PENDING</option>
                            </select>
                            <input
                                value={filterTriggeredBy}
                                onChange={(e) => setFilterTriggeredBy(e.target.value)}
                                placeholder="triggered_by"
                                className={`${filterField} w-28`}
                            />
                            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className={filterField} />
                            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className={filterField} />
                            <button
                                type="button"
                                onClick={() => void load()}
                                className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-black tracking-tight text-white shadow-sm ring-1 ring-emerald-500/25 transition hover:from-emerald-500/95 hover:to-emerald-600/95"
                            >
                                REFRESH
                            </button>
                        </div>
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

                    <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-100/80 text-xs font-bold tracking-widest text-stone-600">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">EVENT</th>
                                    <th className="px-4 py-3">STATUS</th>
                                    <th className="px-4 py-3">BY</th>
                                    <th className="px-4 py-3">AT</th>
                                    <th className="px-4 py-3">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 bg-white/60">
                                {isLoading ? (
                                    <tr>
                                        <td className="px-4 py-6 text-sm text-stone-500" colSpan={6}>
                                            読み込み中…
                                        </td>
                                    </tr>
                                ) : items.length ? (
                                    items.map((x) => {
                                        const badge = statusBadge(x.status_code);
                                        const canRetry = x.status_code === null || x.status_code >= 300;
                                        return (
                                            <tr key={x.id} className="hover:bg-emerald-50/30">
                                                <td className="px-4 py-3 font-mono text-xs text-stone-800">
                                                    {x.id}
                                                    {x.parent_id ? (
                                                        <span className="ml-2 text-[10px] text-stone-400">↳ {x.parent_id}</span>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 text-stone-800">{x.event_type}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${badge.className}`}>
                                                        {badge.label}
                                                    </span>
                                                    {x.error_message ? (
                                                        <div className="mt-1 text-[11px] text-rose-700">{x.error_message}</div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-stone-600">{x.triggered_by ?? '—'}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-stone-600">{x.created_at}</td>
                                                <td className="px-4 py-3">
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
                                                        DETAIL
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
                                                        {isRetryingId === x.id ? 'RETRYING…' : 'RETRY'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td className="px-4 py-6 text-sm text-stone-500" colSpan={6}>
                                            ログがありません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </NeonCard>
            </div>

            {detailId !== null ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/30 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-emerald-100/70 bg-emerald-50/50 shadow-nordic ring-1 ring-stone-900/5">
                        <div className="flex items-center justify-between border-b border-stone-200 bg-white/60 px-5 py-4">
                            <div className="text-sm font-black tracking-tight text-stone-900">DETAIL #{detailId}</div>
                            <button
                                type="button"
                                onClick={() => {
                                    setDetailId(null);
                                    setDetail(null);
                                    setIsDetailLoading(false);
                                }}
                                className={ghostBtn}
                            >
                                CLOSE
                            </button>
                        </div>
                        <div className="max-h-[70vh] space-y-4 overflow-auto p-5 text-sm text-stone-800">
                            {isDetailLoading ? (
                                <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                                    読み込み中…
                                </div>
                            ) : detail ? (
                                <>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                                            <div className="text-[11px] font-bold tracking-widest text-stone-500">EVENT</div>
                                            <div className="mt-1 text-stone-800">{detail.event_type}</div>
                                        </div>
                                        <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                                            <div className="text-[11px] font-bold tracking-widest text-stone-500">STATUS</div>
                                            <div className="mt-1 text-stone-800">{detail.status_code ?? '—'}</div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                                        <div className="text-[11px] font-bold tracking-widest text-stone-500">PAYLOAD</div>
                                        <pre className="json-pre-light mt-2">{JSON.stringify(detail.payload, null, 2)}</pre>
                                    </div>

                                    <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                                        <div className="text-[11px] font-bold tracking-widest text-stone-500">RESPONSE</div>
                                        <pre className="json-pre-light mt-2">{detail.response_body ?? '—'}</pre>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-6 text-sm text-stone-500">
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
