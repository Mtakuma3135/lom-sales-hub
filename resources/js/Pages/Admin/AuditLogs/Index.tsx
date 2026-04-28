import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type Row = {
    id: number;
    integration: string;
    event_type: string;
    status: string;
    status_code: number | null;
    error_message: string | null;
    actor_id: number | null;
    related_type: string | null;
    related_id: number | null;
    created_at: string;
};

type Detail = Row & {
    request_payload: unknown;
    response_body: string | null;
    meta: unknown;
    updated_at: string;
};

function statusBadge(status: string): { label: string; className: string } {
    const s = (status || '').toLowerCase();
    if (s === 'success') {
        return { label: 'SUCCESS', className: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100/85' };
    }
    if (s === 'skipped') {
        return { label: 'SKIPPED', className: 'border-white/10 bg-white/5 text-white/70' };
    }
    if (s === 'pending') {
        return { label: 'PENDING', className: 'border-white/10 bg-white/5 text-white/70' };
    }
    return { label: status?.toUpperCase?.() ?? 'FAILED', className: 'border-rose-400/20 bg-rose-500/10 text-rose-100/85' };
}

export default function Index() {
    const [items, setItems] = useState<Row[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [filterIntegration, setFilterIntegration] = useState<string>('');
    const [filterEventType, setFilterEventType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('failed');
    const [filterActorId, setFilterActorId] = useState<string>('');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');

    const [detailId, setDetailId] = useState<number | null>(null);
    const [detail, setDetail] = useState<Detail | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

    const api = useMemo(() => {
        return {
            index: (params: {
                integration?: string;
                event_type?: string;
                status?: string;
                actor_id?: string;
                date_from?: string;
                date_to?: string;
            }) => {
                const qs = new URLSearchParams();
                if (params.integration) qs.set('integration', params.integration);
                if (params.event_type) qs.set('event_type', params.event_type);
                if (params.status) qs.set('status', params.status);
                if (params.actor_id) qs.set('actor_id', params.actor_id);
                if (params.date_from) qs.set('date_from', params.date_from);
                if (params.date_to) qs.set('date_to', params.date_to);
                const url = `${route('portal.api.audit-logs.index')}?${qs.toString()}`;
                return fetch(url, { headers: { Accept: 'application/json' } });
            },
            show: (id: number) => fetch(route('portal.api.audit-logs.show', { id }), { headers: { Accept: 'application/json' } }),
        };
    }, []);

    const load = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const res = await api.index({
                integration: filterIntegration || undefined,
                event_type: filterEventType || undefined,
                status: filterStatus || undefined,
                actor_id: filterActorId || undefined,
                date_from: filterDateFrom || undefined,
                date_to: filterDateTo || undefined,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as unknown;
            setItems(Array.isArray(json) ? (json as Row[]) : []);
        } catch {
            setErrorMessage('監査ログ一覧の取得に失敗しました。再読み込みしてください。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const uniqueIntegrations = useMemo(() => {
        const set = new Set(items.map((x) => x.integration));
        return Array.from(set).sort();
    }, [items]);

    const uniqueEventTypes = useMemo(() => {
        const set = new Set(items.map((x) => x.event_type));
        return Array.from(set).sort();
    }, [items]);

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">AUDIT LOG (ADMIN)</h2>}>
            <Head title="監査ログ（管理者）" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-white/60">LIST</div>
                            <div className="mt-1 text-lg font-black tracking-tight text-white">監査ログ</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={filterIntegration}
                                onChange={(e) => setFilterIntegration(e.target.value)}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 focus:bg-white focus:text-black"
                            >
                                <option value="">INTEGRATION: ALL</option>
                                {uniqueIntegrations.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterEventType}
                                onChange={(e) => setFilterEventType(e.target.value)}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 focus:bg-white focus:text-black"
                            >
                                <option value="">EVENT: ALL</option>
                                {uniqueEventTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 focus:bg-white focus:text-black"
                            >
                                <option value="">STATUS: ALL</option>
                                <option value="success">SUCCESS</option>
                                <option value="failed">FAILED</option>
                                <option value="pending">PENDING</option>
                                <option value="skipped">SKIPPED</option>
                            </select>
                            <input
                                value={filterActorId}
                                onChange={(e) => setFilterActorId(e.target.value)}
                                placeholder="actor_id"
                                className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 placeholder:text-white/30 focus:bg-white focus:text-black"
                            />
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 focus:bg-white focus:text-black"
                            />
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 focus:bg-white focus:text-black"
                            />
                            <button
                                type="button"
                                onClick={() => void load()}
                                className="rounded-xl bg-gradient-to-r from-purple-500/30 to-cyan-400/20 px-3 py-2 text-xs font-black tracking-tight text-white shadow-[0_0_0_1px_rgba(34,211,238,0.14)] hover:brightness-110"
                            >
                                REFRESH
                            </button>
                        </div>
                    </div>

                    {errorMessage ? (
                        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100/80">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-xs font-bold tracking-widest text-white/55">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">INTEG</th>
                                    <th className="px-4 py-3">EVENT</th>
                                    <th className="px-4 py-3">STATUS</th>
                                    <th className="px-4 py-3">ACTOR</th>
                                    <th className="px-4 py-3">RELATED</th>
                                    <th className="px-4 py-3">AT</th>
                                    <th className="px-4 py-3">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 bg-[#0b1020]/35">
                                {isLoading ? (
                                    <tr>
                                        <td className="px-4 py-6 text-sm text-white/40" colSpan={8}>
                                            読み込み中…
                                        </td>
                                    </tr>
                                ) : items.length ? (
                                    items.map((x) => {
                                        const badge = statusBadge(x.status);
                                        return (
                                            <tr key={x.id} className="hover:bg-white/5">
                                                <td className="px-4 py-3 font-mono text-xs text-white/80">{x.id}</td>
                                                <td className="px-4 py-3 text-white/80">{x.integration}</td>
                                                <td className="px-4 py-3 text-white/80">{x.event_type}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${badge.className}`}>
                                                        {badge.label}
                                                    </span>
                                                    {x.status_code !== null ? (
                                                        <span className="ml-2 font-mono text-[11px] text-white/55">{x.status_code}</span>
                                                    ) : null}
                                                    {x.error_message ? (
                                                        <div className="mt-1 text-[11px] text-rose-100/70">{x.error_message}</div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-white/55">{x.actor_id ?? '—'}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-white/55">
                                                    {x.related_type ? (
                                                        <span>
                                                            {x.related_type.split('\\').pop()}#{x.related_id ?? '—'}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-white/55">{x.created_at}</td>
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
                                                                const json = (await res.json()) as Detail;
                                                                setDetail(json);
                                                            } catch {
                                                                setErrorMessage('詳細の取得に失敗しました。');
                                                            } finally {
                                                                setIsDetailLoading(false);
                                                            }
                                                        }}
                                                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 hover:bg-white/10"
                                                    >
                                                        DETAIL
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td className="px-4 py-6 text-sm text-white/40" colSpan={8}>
                                            ログがありません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {detailId !== null ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
                    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#050510] shadow-[0_0_60px_rgba(34,211,238,0.10)]">
                        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
                            <div className="text-sm font-black tracking-tight text-white">DETAIL #{detailId}</div>
                            <button
                                type="button"
                                onClick={() => {
                                    setDetailId(null);
                                    setDetail(null);
                                    setIsDetailLoading(false);
                                }}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black tracking-tight text-white/80 hover:bg-white/10"
                            >
                                CLOSE
                            </button>
                        </div>
                        <div className="max-h-[70vh] space-y-4 overflow-auto p-5 text-sm">
                            {isDetailLoading ? (
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/40">読み込み中…</div>
                            ) : detail ? (
                                <>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                            <div className="text-[11px] font-bold tracking-widest text-white/55">INTEGRATION</div>
                                            <div className="mt-1 text-white/80">{detail.integration}</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                            <div className="text-[11px] font-bold tracking-widest text-white/55">EVENT</div>
                                            <div className="mt-1 text-white/80">{detail.event_type}</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                            <div className="text-[11px] font-bold tracking-widest text-white/55">STATUS</div>
                                            <div className="mt-1 text-white/80">
                                                {detail.status} {detail.status_code !== null ? `(${detail.status_code})` : ''}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                            <div className="text-[11px] font-bold tracking-widest text-white/55">ACTOR</div>
                                            <div className="mt-1 font-mono text-white/80">{detail.actor_id ?? '—'}</div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                        <div className="text-[11px] font-bold tracking-widest text-white/55">REQUEST_PAYLOAD</div>
                                        <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/80">
                                            {JSON.stringify(detail.request_payload ?? null, null, 2)}
                                        </pre>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                        <div className="text-[11px] font-bold tracking-widest text-white/55">META</div>
                                        <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/80">
                                            {JSON.stringify(detail.meta ?? null, null, 2)}
                                        </pre>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                        <div className="text-[11px] font-bold tracking-widest text-white/55">RESPONSE</div>
                                        <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/80">
                                            {detail.response_body ?? '—'}
                                        </pre>
                                    </div>

                                    {detail.error_message ? (
                                        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100/80">
                                            {detail.error_message}
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/40">データがありません</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
    );
}

