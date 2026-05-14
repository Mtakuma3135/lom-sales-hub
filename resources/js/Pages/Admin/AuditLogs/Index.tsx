import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useState } from 'react';
import NordicCard from '@/Components/UI/NordicCard';
import StatusBadge from '@/Components/StatusBadge';
import JsonCodeBlock from '@/Components/JsonCodeBlock';
import { nextDir, type SortDir, SortableTh } from '@/Components/SortableTh';

function auditRowStatusVariant(
    status: string,
): { label: string; variant: 'success' | 'danger' | 'warning' | 'muted' } {
    const s = status.toLowerCase();
    if (s === 'success') return { label: status, variant: 'success' };
    if (s === 'failed') return { label: status, variant: 'danger' };
    if (s === 'skipped' || s === 'mock') return { label: s === 'mock' ? '擬似' : status, variant: 'warning' };
    if (s === 'pending') return { label: status, variant: 'muted' };
    return { label: status, variant: 'muted' };
}

type Row = {
    id: number;
    integration: string;
    event_type: string;
    status: string;
    status_code: number | null;
    error_message: string | null;
    actor_id: number | null;
    user?: { id: number; name: string } | null;
    related_id: number | null;
    meta?: Record<string, unknown> | null;
    mode?: string | null;
    created_at: string;
};

type Detail = Row & {
    request_payload: unknown;
    response_body: string | null;
    meta: unknown;
    updated_at: string;
};

function statusCodeVariant(code: number | null): { label: string; variant: 'success' | 'danger' | 'muted' } {
    if (code === null) return { label: '—', variant: 'muted' };
    if (code >= 200 && code < 300) return { label: String(code), variant: 'success' };
    return { label: String(code), variant: 'danger' };
}

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

function actionLabel(integration: string, eventType: string): string {
    const key = `${integration}:${eventType}`;
    if (key.startsWith('kot:')) return 'KOT Punch';
    if (key.startsWith('gas:')) return 'GAS Upload';
    return `${integration.toUpperCase()} ${eventType}`;
}

function formatJst(dt: string): string {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return dt;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function Index() {
    const { props } = usePage<{ logs: Paginator<Row> }>();
    const items = props.logs?.data ?? [];
    const currentParams = new URLSearchParams(window.location.search);
    const sort = currentParams.get('sort') ?? 'created_at';
    const dir = ((currentParams.get('dir') ?? 'desc') === 'asc' ? 'asc' : 'desc') as SortDir;
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [cache, setCache] = useState<Record<number, Detail | 'loading' | 'error'>>({});

    const toggleSort = (key: string) => {
        const next = new URLSearchParams(window.location.search);
        const curSort = next.get('sort') ?? 'created_at';
        const curDir = ((next.get('dir') ?? 'desc') === 'asc' ? 'asc' : 'desc') as SortDir;

        if (curSort !== key) {
            next.set('sort', key);
            next.set('dir', 'asc');
        } else {
            next.set('dir', nextDir(curDir));
        }
        window.location.href = `${window.location.pathname}?${next.toString()}`;
    };

    const toggleRow = async (id: number) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        const prev = cache[id];
        if (prev && prev !== 'loading' && prev !== 'error') return;
        setCache((c) => ({ ...c, [id]: 'loading' }));
        try {
            const res = await fetch(route('admin.audit-logs.show', { audit_log: id }), {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as Detail;
            setCache((c) => ({ ...c, [id]: json }));
        } catch {
            setCache((c) => ({ ...c, [id]: 'error' }));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-semibold tracking-tight text-wa-body">監査ログ</h2>}>
            <Head title="監査ログ（管理者）" />
            <div className="mx-auto max-w-6xl text-wa-body wa-body-track">
                <NordicCard elevate={false} className="p-8">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-wa-muted">一覧</div>
                            <div className="mt-2 text-xl font-semibold tracking-tight text-wa-body">
                                外部連携の監査ログ
                            </div>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-wa-muted">
                                行をクリックすると、この場で詳細が開きます。JSON は墨面（ダーク）上で読みやすく表示します。
                            </p>
                        </div>
                        <div className="rounded-full border border-teal-500/35 bg-wa-ink px-4 py-2 text-sm font-medium text-teal-300 ring-1 ring-teal-500/20">
                            {props.logs?.total ?? 0} 件
                        </div>
                    </div>

                    <div className="mt-10 overflow-hidden rounded-sm border border-wa-accent/20 bg-wa-ink">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-wa-card text-xs font-semibold uppercase tracking-wider text-wa-muted">
                                <tr>
                                    <SortableTh
                                        label="実行日時"
                                        active={sort === 'created_at'}
                                        dir={dir}
                                        onToggle={() => toggleSort('created_at')}
                                        className="px-5 py-4"
                                    />
                                    <th className="px-5 py-4">ユーザー</th>
                                    <SortableTh
                                        label="アクション"
                                        active={sort === 'event_type'}
                                        dir={dir}
                                        onToggle={() => toggleSort('event_type')}
                                        className="px-5 py-4"
                                    />
                                    <SortableTh
                                        label="記録 / HTTP"
                                        active={sort === 'status_code'}
                                        dir={dir}
                                        onToggle={() => toggleSort('status_code')}
                                        className="px-5 py-4"
                                    />
                                    <SortableTh
                                        label="対象ID"
                                        active={sort === 'related_id'}
                                        dir={dir}
                                        onToggle={() => toggleSort('related_id')}
                                        className="px-5 py-4"
                                    />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-wa-accent/15 bg-wa-card">
                                {items.length ? (
                                    items.map((x) => {
                                        const httpBadge = statusCodeVariant(x.status_code);
                                        const rowSt = auditRowStatusVariant(x.status);
                                        const open = expandedId === x.id;
                                        const rowDetail = cache[x.id];
                                        const modeVal =
                                            typeof x.mode === 'string' && x.mode !== ''
                                                ? x.mode
                                                : x.meta && typeof x.meta === 'object' && 'mode' in x.meta
                                                  ? String((x.meta as Record<string, unknown>).mode ?? '')
                                                  : '';
                                        const showMock = modeVal === 'mock' || x.status.toLowerCase() === 'skipped';
                                        return (
                                            <Fragment key={x.id}>
                                                <tr
                                                    className={
                                                        'cursor-pointer transition-colors ' +
                                                        (open ? 'bg-teal-500/10' : 'hover:bg-wa-ink/80')
                                                    }
                                                    onClick={() => toggleRow(x.id)}
                                                >
                                                    <td className="px-5 py-4 font-mono text-xs text-wa-muted">
                                                        {formatJst(x.created_at)}
                                                    </td>
                                                    <td className="px-5 py-4 text-wa-body">
                                                        {x.user?.name ?? (x.actor_id ? `#${x.actor_id}` : '—')}
                                                    </td>
                                                    <td className="px-5 py-4 font-medium text-wa-body">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span>{actionLabel(x.integration, x.event_type)}</span>
                                                            {showMock ? (
                                                                <span className="rounded-full border border-wa-accent/20 bg-wa-ink px-2 py-0.5 text-[10px] font-semibold text-wa-muted">
                                                                    MOCK
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <StatusBadge variant={rowSt.variant}>{rowSt.label}</StatusBadge>
                                                            <StatusBadge variant={httpBadge.variant}>{httpBadge.label}</StatusBadge>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 font-mono text-xs text-wa-muted">
                                                        {x.related_id ?? '—'}
                                                    </td>
                                                </tr>
                                                <AnimatePresence initial={false}>
                                                    {open ? (
                                                        <tr className="bg-wa-ink/90">
                                                            <td colSpan={5} className="p-0">
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{
                                                                        duration: 0.35,
                                                                        ease: [0.16, 1, 0.3, 1],
                                                                    }}
                                                                    className="overflow-hidden border-t border-wa-accent/15"
                                                                >
                                                                    <div className="space-y-6 px-5 py-8">
                                                                        {rowDetail === 'loading' ? (
                                                                            <p className="text-sm text-wa-muted">
                                                                                読み込み中…
                                                                            </p>
                                                                        ) : rowDetail === 'error' ? (
                                                                            <p className="text-sm text-red-300">
                                                                                取得に失敗しました。
                                                                            </p>
                                                                        ) : typeof rowDetail === 'object' ? (
                                                                            <>
                                                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                                                    <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-4">
                                                                                        <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">
                                                                                            Integration
                                                                                        </div>
                                                                                        <div className="mt-1 text-wa-body">
                                                                                            {rowDetail.integration}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-4">
                                                                                        <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">
                                                                                            Event
                                                                                        </div>
                                                                                        <div className="mt-1 text-wa-body">
                                                                                            {rowDetail.event_type}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-4">
                                                                                        <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">
                                                                                            Status
                                                                                        </div>
                                                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-wa-body">
                                                                                            <span>{rowDetail.status}</span>
                                                                                            <StatusBadge
                                                                                                variant={
                                                                                                    statusCodeVariant(
                                                                                                        rowDetail.status_code
                                                                                                    ).variant
                                                                                                }
                                                                                            >
                                                                                                {rowDetail.status_code !== null
                                                                                                    ? String(rowDetail.status_code)
                                                                                                    : '—'}
                                                                                            </StatusBadge>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-4">
                                                                                        <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">
                                                                                            Actor
                                                                                        </div>
                                                                                        <div className="mt-1 font-mono text-wa-body">
                                                                                            {rowDetail.actor_id ?? '—'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-5">
                                                                                    <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">
                                                                                        Request
                                                                                    </div>
                                                                                    <JsonCodeBlock
                                                                                        value={rowDetail.request_payload}
                                                                                        theme="light"
                                                                                    />
                                                                                </div>
                                                                                <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-5">
                                                                                    <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">
                                                                                        Meta
                                                                                    </div>
                                                                                    <JsonCodeBlock value={rowDetail.meta} theme="light" />
                                                                                </div>
                                                                                <div className="rounded-sm border border-wa-accent/20 bg-wa-ink p-5">
                                                                                    <div className="text-xs font-semibold uppercase tracking-wide text-wa-muted">
                                                                                        Response
                                                                                    </div>
                                                                                    <JsonCodeBlock
                                                                                        value={rowDetail.response_body ?? '—'}
                                                                                        theme="light"
                                                                                    />
                                                                                </div>
                                                                                {rowDetail.error_message ? (
                                                                                    <div className="rounded-sm border border-red-500/35 bg-wa-ink px-4 py-3 text-sm text-red-300">
                                                                                        {rowDetail.error_message}
                                                                                    </div>
                                                                                ) : null}
                                                                            </>
                                                                        ) : null}
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    ) : null}
                                                </AnimatePresence>
                                            </Fragment>
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

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-wa-muted">
                        <div>
                            {props.logs ? (
                                <span>
                                    ページ {props.logs.current_page} / {props.logs.last_page}
                                </span>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {props.logs?.links?.map((l, idx) => (
                                <Link
                                    key={`${idx}-${l.label}`}
                                    href={l.url ?? '#'}
                                    preserveScroll
                                    className={
                                        'rounded-lg border px-3 py-2 text-xs font-semibold transition ' +
                                        (l.active
                                            ? 'border-wa-accent/45 bg-wa-accent text-wa-ink'
                                            : 'border-wa-accent/25 bg-wa-ink text-wa-muted hover:border-wa-accent/35 hover:bg-wa-card hover:text-wa-body') +
                                        (!l.url ? ' pointer-events-none opacity-40' : '')
                                    }
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            ))}
                        </div>
                    </div>
                </NordicCard>
            </div>
        </AuthenticatedLayout>
    );
}
