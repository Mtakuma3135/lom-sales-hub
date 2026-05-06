import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import NeonCard from '@/Components/NeonCard';

type CredentialRow = {
    id: number;
    service_name: string;
    login_id: string;
    password: string;
    is_password: boolean;
    updated_at: string;
};

type MypagePayload = {
    data: {
        profile: { name: string; employee_code: string | null; role: string };
        attendance?: { has_error: boolean; error_dates: string[]; cached_at: string } | null;
        integrations: { key: string; label: string; status: string }[];
        quick_links: { label: string; href: string }[];
        credentials: CredentialRow[] | { data: CredentialRow[] };
    };
};

function parseCredentials(raw: CredentialRow[] | { data: CredentialRow[] } | undefined): CredentialRow[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if ('data' in raw && Array.isArray(raw.data)) return raw.data;
    return [];
}

function maskSecret(value: string): string {
    const n = Math.max(8, Math.min(16, value.length || 8));
    return '\u2022'.repeat(n);
}

const serviceIcons: Record<string, JSX.Element> = {
    salesforce: (
        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
    ),
    slack: (
        <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
    ),
};

function ServiceIcon({ name }: { name: string }) {
    const lower = name.toLowerCase();
    if (serviceIcons[lower]) return serviceIcons[lower];
    if (lower.includes('salesforce')) return serviceIcons.salesforce;
    if (lower.includes('slack')) return serviceIcons.slack;
    return (
        <svg className="h-5 w-5 text-wa-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m16.5-18v18M5.25 3h13.5M5.25 21h13.5M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
    );
}

const btnPrimary =
    'inline-flex items-center gap-2 rounded-sm border border-wa-accent/45 bg-wa-accent px-3 py-3 text-sm font-black tracking-tight text-wa-ink transition hover:bg-wa-accent/90';
const btnGhost =
    'inline-flex items-center gap-2 rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-3 text-sm font-black tracking-tight text-wa-body transition hover:border-wa-accent/40';

export default function Index({ mypage }: { mypage?: MypagePayload }) {
    const profile =
        mypage?.data.profile ??
        ({ name: 'ゲストユーザー', employee_code: null, role: 'general' } as const);

    const integrations =
        mypage?.data.integrations ?? [
            { key: 'king_of_time', label: 'KING OF TIME', status: 'connected' },
            { key: 'discord', label: 'Discord（通知）', status: 'not_connected' },
        ];

    const attendance = mypage?.data.attendance ?? null;
    const credentials = parseCredentials(mypage?.data.credentials);

    const [pwOpen, setPwOpen] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');

    const [kotLoading, setKotLoading] = useState(false);
    const [kotPulse, setKotPulse] = useState(false);
    const [kotMessage, setKotMessage] = useState<string | null>(null);
    const [kotPending, setKotPending] = useState(false);

    const [pressingReveal, setPressingReveal] = useState<Record<number, boolean>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(key);
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-sm font-black tracking-tight text-wa-body">マイページ</h2>}
        >
            <Head title="マイページ" />
            <div className="mx-auto max-w-6xl text-wa-body wa-body-track">
                {/* Top: Profile + Attendance */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* Profile */}
                    <NeonCard className="lg:col-span-2">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-wa-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-wa-accent">PROFILE</div>
                                <div className="text-xs text-wa-muted">ユーザー</div>
                            </div>
                        </div>

                        <div className="mt-5 space-y-2">
                            <div className="text-2xl font-black tracking-tighter text-wa-body">
                                {profile.name}
                            </div>
                            <div className="text-sm text-wa-muted">
                                社員コード: {profile.employee_code ?? '-'}
                            </div>
                            <div className="text-sm text-wa-muted">
                                権限: {profile.role}
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <button type="button" className={btnPrimary}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                                連携設定
                            </button>
                            <button type="button" onClick={() => setPwOpen(true)} className={btnGhost}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                                パスワード変更
                            </button>
                        </div>

                        {/* Integrations */}
                        <div className="mt-5 border-t border-wa-accent/15 pt-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-wa-muted">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                                外部連携
                            </div>
                            <div className="mt-2 space-y-1.5">
                                {integrations.map((i) => (
                                    <div key={i.key} className="flex items-center justify-between">
                                        <span className="text-xs text-wa-body">{i.label}</span>
                                        <span
                                            className={
                                                'rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                                                (i.status === 'connected'
                                                    ? 'border border-teal-500/35 text-teal-300'
                                                    : 'border border-wa-accent/20 text-wa-muted')
                                            }
                                        >
                                            {i.status === 'connected' ? '接続中' : '未接続'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </NeonCard>

                    {/* Attendance + KOT */}
                    <div className="lg:col-span-3">
                        <NeonCard elevate={false}>
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-wa-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-wa-accent">ATTENDANCE</div>
                                    <div className="text-xs text-wa-muted">勤怠エラー</div>
                                </div>
                            </div>

                            {attendance ? (
                                attendance.has_error ? (
                                    <div className="mt-4 rounded-sm border border-red-500/35 bg-red-950/40 p-5">
                                        <div className="flex items-center gap-2">
                                            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                            </svg>
                                            <span className="text-lg font-black tracking-tight text-red-200">エラーあり</span>
                                        </div>
                                        <div className="mt-2 text-xs text-red-300/70">
                                            cached_at: {attendance.cached_at}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {attendance.error_dates.map((d) => (
                                                <span
                                                    key={d}
                                                    className="inline-flex items-center rounded-sm border border-red-500/35 bg-red-950/50 px-3 py-1 text-xs font-bold text-red-200"
                                                >
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-sm border border-teal-500/35 bg-wa-ink p-5">
                                        <div className="flex items-center gap-2">
                                            <svg className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-lg font-black tracking-tight text-teal-200">エラーなし</span>
                                        </div>
                                        <div className="mt-2 text-xs text-wa-muted">
                                            cached_at: {attendance.cached_at}
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="mt-4 rounded-sm border border-teal-500/35 bg-wa-ink p-5">
                                    <div className="flex items-center gap-2">
                                        <svg className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-lg font-black tracking-tight text-teal-200">エラーなし</span>
                                    </div>
                                    <div className="mt-2 text-xs text-wa-muted">
                                        cached_at: —
                                    </div>
                                </div>
                            )}

                            <div className="mt-5 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    disabled={kotLoading || kotPending}
                                    onClick={async () => {
                                        setKotLoading(true);
                                        setKotMessage(null);
                                        setKotPending(false);
                                        try {
                                            const res = await fetch('/api/mypage/kot/punch', {
                                                method: 'POST',
                                                headers: { Accept: 'application/json' },
                                            });
                                            const json = await res.json().catch(() => null);
                                            if (res.status === 422) {
                                                setKotMessage(json?.message ?? '1分以内の重複打刻はできません');
                                                return;
                                            }
                                            if (!res.ok) throw new Error();

                                            const status = (json?.status as string) || '';
                                            if (status === 'success') {
                                                setKotMessage(json?.message ?? '打刻しました');
                                                setKotPulse(true);
                                                setTimeout(() => setKotPulse(false), 900);
                                            } else {
                                                setKotPending(true);
                                                setKotMessage(json?.message ?? '連携待ち（処理中）');
                                                setTimeout(() => setKotPending(false), 65_000);
                                            }
                                        } catch {
                                            setKotMessage('通信に失敗しました');
                                        } finally {
                                            setKotLoading(false);
                                        }
                                    }}
                                    className={
                                        'inline-flex items-center gap-2 ' +
                                        (kotLoading
                                            ? 'rounded-sm px-5 py-3 text-sm font-black tracking-widest bg-wa-ink text-wa-muted ring-1 ring-wa-accent/20'
                                            : kotPending
                                              ? 'rounded-sm border border-wa-accent/25 bg-wa-card px-5 py-3 text-sm font-black tracking-widest text-wa-body transition hover:border-wa-accent/40'
                                              : 'rounded-sm border border-wa-accent/45 bg-wa-accent px-5 py-3 text-sm font-black tracking-widest text-wa-ink transition hover:bg-wa-accent/90' +
                                                (kotPulse ? ' animate-pulse' : ''))
                                    }
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {kotLoading ? 'LOADING…' : kotPending ? 'KOT 再試行' : 'KOT 打刻'}
                                </button>
                                <div className="text-xs text-wa-muted">{kotMessage ?? '—'}</div>
                            </div>
                        </NeonCard>
                    </div>
                </div>

                {/* Credentials Section */}
                <div className="mt-6">
                    <NeonCard elevate={false}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-wa-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                </svg>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-wa-accent">CREDENTIALS</div>
                                    <div className="text-xs text-wa-muted">ID / パス管理</div>
                                </div>
                            </div>
                            <div className="text-xs text-wa-muted">
                                {credentials.length > 0 ? `${credentials.length} 件` : ''}
                            </div>
                        </div>

                        {credentials.length === 0 ? (
                            <div className="mt-4 rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-8 text-center text-sm text-wa-muted">
                                登録されている情報はありません
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {credentials.map((c) => {
                                    const showSecret = c.is_password && !!pressingReveal[c.id];
                                    const passwordDisplay = !c.is_password
                                        ? '—'
                                        : showSecret
                                          ? c.password || '—'
                                          : maskSecret(c.password);

                                    return (
                                        <div
                                            key={c.id}
                                            className="rounded-sm border border-wa-accent/20 bg-wa-ink p-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ServiceIcon name={c.service_name} />
                                                <span className="text-sm font-black tracking-tight text-wa-body">
                                                    {c.service_name}
                                                </span>
                                            </div>

                                            <div className="mt-3 space-y-2">
                                                <div>
                                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
                                                        ログインID
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5">
                                                        <span className="min-w-0 truncate font-mono text-sm text-wa-body">
                                                            {c.login_id || '—'}
                                                        </span>
                                                        {c.login_id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(c.login_id, `login-${c.id}`)}
                                                                className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-wa-accent/20 px-2 py-0.5 text-[10px] text-wa-muted transition hover:border-wa-accent/40 hover:text-wa-body"
                                                            >
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                                                </svg>
                                                                {copiedId === `login-${c.id}` ? 'OK' : 'copy'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-wa-muted">
                                                            パスワード
                                                        </span>
                                                        {c.is_password && (
                                                            <button
                                                                type="button"
                                                                className="inline-flex select-none items-center gap-1 rounded-sm border border-wa-accent/20 px-2 py-0.5 text-[10px] text-wa-muted transition hover:border-wa-accent/40 hover:text-wa-body"
                                                                onMouseDown={() => setPressingReveal((m) => ({ ...m, [c.id]: true }))}
                                                                onMouseUp={() => setPressingReveal((m) => ({ ...m, [c.id]: false }))}
                                                                onMouseLeave={() => setPressingReveal((m) => ({ ...m, [c.id]: false }))}
                                                                onBlur={() => setPressingReveal((m) => ({ ...m, [c.id]: false }))}
                                                            >
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                hold
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5">
                                                        <span className="min-w-0 break-all font-mono text-sm text-wa-body">
                                                            {passwordDisplay}
                                                        </span>
                                                        {c.is_password && c.password && (
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(c.password, `pw-${c.id}`)}
                                                                className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-wa-accent/20 px-2 py-0.5 text-[10px] text-wa-muted transition hover:border-wa-accent/40 hover:text-wa-body"
                                                            >
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                                                </svg>
                                                                {copiedId === `pw-${c.id}` ? 'OK' : 'copy'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-1 text-right text-[10px] text-wa-muted">
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                                {c.updated_at}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </NeonCard>
                </div>
            </div>

            {/* Password change modal */}
            {pwOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-wa-ink/75 p-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-xl rounded-sm border border-wa-accent/20 bg-wa-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">
                                    PASSWORD
                                </div>
                                <div className="mt-1 text-lg font-black tracking-tight text-wa-body">
                                    パスワード変更
                                </div>
                                <div className="mt-1 text-xs text-wa-muted">
                                    8文字以上・英大/小/数字を含めてください
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPwOpen(false)}
                                className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/40"
                            >
                                CLOSE
                            </button>
                        </div>

                        <div className="mt-5 space-y-3">
                            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="現在のパスワード" className="nordic-field" />
                            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="新しいパスワード" className="nordic-field" />
                            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="新しいパスワード（確認）" className="nordic-field" />

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPwOpen(false)}
                                    className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2.5 text-sm font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.patch(
                                            route('mypage.password.update'),
                                            {
                                                current_password: currentPw,
                                                new_password: newPw,
                                                new_password_confirmation: confirmPw,
                                            },
                                            {
                                                onSuccess: () => {
                                                    setCurrentPw('');
                                                    setNewPw('');
                                                    setConfirmPw('');
                                                    setPwOpen(false);
                                                },
                                            },
                                        );
                                    }}
                                    className={btnPrimary + ' px-4 py-2.5'}
                                >
                                    SAVE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
    );
}
