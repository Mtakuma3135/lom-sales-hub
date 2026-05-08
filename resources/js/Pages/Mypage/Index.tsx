import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import NeonCard from '@/Components/NeonCard';
import SectionHeader from '@/Components/UI/SectionHeader';

type CredentialRow = {
    id: number;
    service_name: string;
    login_id: string;
    password: string;
    is_password: boolean;
    updated_at: string;
    is_mock?: boolean;
};

type AttendancePayload = {
    state: 'not_connected' | 'not_fetched' | 'ok' | 'has_error' | 'error';
    has_error: boolean;
    error_dates: string[];
    cached_at: string | null;
    message?: string;
};

type MypagePayload = {
    data: {
        profile: { name: string; employee_code: string | null; role: string };
        attendance?: AttendancePayload | null;
        kot_status?: {
            connected: boolean;
            last_event_type: string | null;
            last_status: string | null;
            last_status_code: number | null;
            last_at: string | null;
            last_message: string | null;
            mode: string | null;
        } | null;
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

const btnPrimary =
    'rounded-xl border border-wa-accent/40 bg-wa-accent px-3 py-3 text-sm font-black tracking-tight text-wa-ink transition hover:bg-wa-accent/90';
const btnGhost =
    'rounded-xl border border-wa-accent/20 bg-wa-ink px-3 py-3 text-sm font-black tracking-tight text-wa-body transition hover:border-wa-accent/35';

export default function Index({ mypage }: { mypage?: MypagePayload }) {
    const isDev = import.meta.env.DEV;
    const hasPayload = mypage?.data !== undefined;

    const profile = hasPayload
        ? mypage.data.profile
        : isDev
            ? ({ name: 'ゲストユーザー', employee_code: null, role: 'general' } as const)
            : ({ name: '', employee_code: null, role: 'general' } as const);

    const integrations = hasPayload
        ? mypage.data.integrations
        : isDev
            ? [
                { key: 'king_of_time', label: 'KING OF TIME', status: 'not_connected' },
                { key: 'discord', label: 'Discord（通知）', status: 'not_connected' },
            ]
            : [];

    const attendance = mypage?.data.attendance ?? null;
    const kotStatus = mypage?.data.kot_status ?? null;
    const credentials = parseCredentials(mypage?.data.credentials);

    const [pwOpen, setPwOpen] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');

    const [kotLoading, setKotLoading] = useState(false);
    const [kotPulse, setKotPulse] = useState(false);
    const [kotMessage, setKotMessage] = useState<string | null>(null);
    const [kotPending, setKotPending] = useState(false);

    const [pwErrors, setPwErrors] = useState<Record<string, string[]>>({});

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
            header={<h2 className="text-sm font-black tracking-tight text-wa-body">MY / CONSOLE</h2>}
        >
            <Head title="マイページ" />
            <div className="mx-auto max-w-6xl text-wa-body wa-body-track">
                {!hasPayload && !isDev ? (
                    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/25 px-5 py-4 text-sm text-amber-200">
                        データを取得できませんでした。再読み込みしても改善しない場合は管理者に連絡してください。
                    </div>
                ) : null}
                {/* ── Top: Profile + Attendance ── */}
                <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
                    <NeonCard className="flex h-full min-h-0 flex-col">
                        <SectionHeader eyebrow="PROFILE" title="ユーザー" />
                        <div className="mt-4 space-y-2">
                            <div className="text-2xl font-black tracking-tighter text-wa-body">
                                {profile.name || '—'}
                            </div>
                            <div className="text-sm font-semibold text-wa-muted">
                                社員コード: {profile.employee_code ?? '-'}
                            </div>
                            <div className="text-sm font-semibold text-wa-muted">
                                権限: {profile.role}
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <button type="button" className={btnPrimary}>
                                連携設定
                            </button>
                            <button type="button" onClick={() => setPwOpen(true)} className={btnGhost}>
                                パスワード変更
                            </button>
                        </div>

                        {/* Integrations inline */}
                        <div className="mt-5 border-t border-wa-accent/15 pt-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-wa-muted">
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

                    <div className="flex min-h-0 lg:col-span-2">
                        <NeonCard elevate={false} className="flex min-h-[320px] w-full flex-col flex-1">
                            <SectionHeader eyebrow="ATTENDANCE" title="勤怠エラー" />

                            {attendance ? (
                                attendance.state === 'has_error' && attendance.has_error ? (
                                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/35 p-4">
                                        <div className="text-sm font-black tracking-tight text-red-200">
                                            エラーあり
                                        </div>
                                        <div className="mt-2 text-xs text-red-300">
                                            cached_at: {attendance.cached_at ?? '—'}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {attendance.error_dates.map((d) => (
                                                <span
                                                    key={d}
                                                    className="inline-flex items-center rounded-full border border-red-500/30 bg-red-950/45 px-3 py-1 text-xs font-black tracking-tight text-red-200"
                                                >
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : attendance.state === 'ok' ? (
                                    <div className="mt-4 rounded-xl border border-teal-500/30 bg-wa-ink p-4">
                                        <div className="text-sm font-black tracking-tight text-teal-200">
                                            エラーなし
                                        </div>
                                        <div className="mt-2 text-xs text-teal-300">
                                            cached_at: {attendance.cached_at ?? '—'}
                                        </div>
                                    </div>
                                ) : attendance.state === 'not_connected' ? (
                                    <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100">
                                        <div className="font-black tracking-tight text-amber-200">
                                            KOT 未連携（サーバー設定）
                                        </div>
                                        <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
                                            API URL またはトークンが未設定のため、勤怠サマリーは取得できません。
                                        </p>
                                    </div>
                                ) : attendance.state === 'not_fetched' ? (
                                    <div className="mt-4 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-4 text-sm text-wa-muted">
                                        勤怠データはまだ取得されていません（未取得）
                                    </div>
                                ) : attendance.state === 'error' ? (
                                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/25 p-4 text-sm text-red-200">
                                        {attendance.message ?? '勤怠情報を表示できませんでした。'}
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-4 text-sm text-wa-muted">
                                        —
                                    </div>
                                )
                            ) : (
                                <div className="mt-4 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-4 text-sm text-wa-muted">
                                    （未取得）
                                </div>
                            )}

                            <div className="mt-4 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-4 text-sm text-wa-muted">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-xs font-bold uppercase tracking-widest text-wa-muted">
                                        KOT 連携
                                    </div>
                                    <div
                                        className={
                                            'rounded-full border px-2.5 py-1 text-[10px] font-bold ' +
                                            (kotStatus?.connected
                                                ? 'border-teal-500/35 text-teal-300'
                                                : 'border-wa-accent/20 text-wa-muted')
                                        }
                                    >
                                        {kotStatus?.connected ? 'CONNECTED' : 'NOT CONNECTED'}
                                    </div>
                                </div>
                                {kotStatus?.last_at ? (
                                    <div className="mt-2 space-y-1 text-xs">
                                        <div className="font-mono text-wa-muted">
                                            last: {kotStatus.last_at}
                                            {kotStatus.mode === 'mock' || kotStatus.last_status === 'skipped'
                                                ? ' (local mock / 未送信)'
                                                : ''}
                                        </div>
                                        <div className="text-wa-body">
                                            {kotStatus.last_event_type ?? '—'} / {kotStatus.last_status ?? '—'}
                                            {kotStatus.last_status_code !== null ? ` (${kotStatus.last_status_code})` : ''}
                                        </div>
                                        {kotStatus.last_message ? (
                                            <div className="line-clamp-2 text-wa-muted">{kotStatus.last_message}</div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-wa-muted">監査ログがまだありません</div>
                                )}
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    disabled={kotLoading || kotPending}
                                    onClick={async () => {
                                        setKotLoading(true);
                                        setKotMessage(null);
                                        setKotPending(false);
                                        try {
                                            const res = await fetch(route('portal.api.mypage.kot.punch'), {
                                                method: 'POST',
                                                headers: {
                                                    Accept: 'application/json',
                                                    'X-Requested-With': 'XMLHttpRequest',
                                                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                                                },
                                                credentials: 'same-origin',
                                            });
                                            const json = await res.json().catch(() => null);
                                            if (res.status === 422) {
                                                setKotMessage(
                                                    json?.message ?? '1分以内の重複打刻はできません',
                                                );
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
                                                setKotMessage(
                                                    json?.message ?? '連携待ち（処理中）',
                                                );
                                                setTimeout(() => setKotPending(false), 65_000);
                                            }
                                        } catch {
                                            setKotMessage('通信に失敗しました');
                                        } finally {
                                            setKotLoading(false);
                                        }
                                    }}
                                    className={
                                        kotLoading
                                            ? 'rounded-xl px-4 py-2 text-xs font-black tracking-widest bg-wa-ink text-wa-muted ring-1 ring-wa-accent/15'
                                            : kotPending
                                              ? 'rounded-xl border border-wa-accent/20 bg-wa-card px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/35'
                                              : 'rounded-xl border border-wa-accent/40 bg-wa-accent px-4 py-2 text-xs font-black tracking-widest text-wa-ink transition hover:bg-wa-accent/90' +
                                                (kotPulse ? ' animate-pulse' : '')
                                    }
                                >
                                    {kotLoading
                                        ? 'LOADING…'
                                        : kotPending
                                          ? 'KOT 再試行'
                                          : 'KOT 打刻'}
                                </button>
                                <div className="text-xs text-wa-muted">{kotMessage ?? '—'}</div>
                            </div>
                        </NeonCard>
                    </div>
                </div>

                {/* ── Credentials Section ── */}
                <div className="mt-6">
                    <NeonCard elevate={false}>
                        <SectionHeader
                            eyebrow="CREDENTIALS"
                            title="ID / パス管理"
                            meta={credentials.length > 0 ? `${credentials.length} 件` : ''}
                        />

                        {credentials.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-8 text-center text-sm text-wa-muted">
                                登録されている情報はありません
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {credentials.map((c) => {
                                    const showSecret =
                                        c.is_password && !!pressingReveal[c.id];
                                    const passwordDisplay = !c.is_password
                                        ? '—'
                                        : showSecret
                                          ? c.password || '—'
                                          : maskSecret(c.password);

                                    return (
                                        <div
                                            key={c.id}
                                            className="rounded-xl border border-wa-accent/15 bg-wa-card p-4 shadow-nordic"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 text-xs font-black tracking-tight text-wa-body">
                                                    <span className="block truncate">{c.service_name}</span>
                                                </div>
                                                {c.is_mock ? (
                                                    <span className="shrink-0 rounded-full border border-wa-accent/20 bg-wa-ink px-2 py-0.5 text-[10px] font-semibold text-wa-muted">
                                                        SAMPLE
                                                    </span>
                                                ) : null}
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
                                                                onClick={() =>
                                                                    copyToClipboard(
                                                                        c.login_id,
                                                                        `login-${c.id}`,
                                                                    )
                                                                }
                                                                className="shrink-0 rounded-lg border border-wa-accent/15 px-2 py-1 text-[10px] text-wa-muted transition hover:border-wa-accent/30 hover:text-wa-body"
                                                            >
                                                                {copiedId === `login-${c.id}`
                                                                    ? 'OK'
                                                                    : 'copy'}
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
                                                                className="select-none rounded-lg border border-wa-accent/15 px-2 py-1 text-[10px] text-wa-muted transition hover:border-wa-accent/30 hover:text-wa-body"
                                                                onMouseDown={() =>
                                                                    setPressingReveal((m) => ({
                                                                        ...m,
                                                                        [c.id]: true,
                                                                    }))
                                                                }
                                                                onMouseUp={() =>
                                                                    setPressingReveal((m) => ({
                                                                        ...m,
                                                                        [c.id]: false,
                                                                    }))
                                                                }
                                                                onMouseLeave={() =>
                                                                    setPressingReveal((m) => ({
                                                                        ...m,
                                                                        [c.id]: false,
                                                                    }))
                                                                }
                                                                onTouchStart={() =>
                                                                    setPressingReveal((m) => ({
                                                                        ...m,
                                                                        [c.id]: true,
                                                                    }))
                                                                }
                                                                onTouchEnd={() =>
                                                                    setPressingReveal((m) => ({
                                                                        ...m,
                                                                        [c.id]: false,
                                                                    }))
                                                                }
                                                                onBlur={() =>
                                                                    setPressingReveal((m) => ({
                                                                        ...m,
                                                                        [c.id]: false,
                                                                    }))
                                                                }
                                                            >
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
                                                                onClick={() =>
                                                                    copyToClipboard(
                                                                        c.password,
                                                                        `pw-${c.id}`,
                                                                    )
                                                                }
                                                                className="shrink-0 rounded-lg border border-wa-accent/15 px-2 py-1 text-[10px] text-wa-muted transition hover:border-wa-accent/30 hover:text-wa-body"
                                                            >
                                                                {copiedId === `pw-${c.id}`
                                                                    ? 'OK'
                                                                    : 'copy'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-2 text-right text-[10px] text-wa-muted">
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
                    <div className="w-full max-w-xl rounded-2xl border border-wa-accent/15 bg-wa-card p-6 shadow-nordic">
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
                                className="rounded-xl border border-wa-accent/20 bg-wa-ink px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/35"
                            >
                                CLOSE
                            </button>
                        </div>

                        <div className="mt-5 space-y-3">
                            {Object.keys(pwErrors).length > 0 && (
                                <div className="rounded-xl border border-red-500/30 bg-red-950/35 px-4 py-3">
                                    {Object.entries(pwErrors).map(([field, msgs]) => (
                                        <div key={field} className="text-xs text-red-300">
                                            {Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <input
                                type="password"
                                value={currentPw}
                                onChange={(e) => setCurrentPw(e.target.value)}
                                placeholder="現在のパスワード"
                                className="nordic-field"
                            />
                            <input
                                type="password"
                                value={newPw}
                                onChange={(e) => setNewPw(e.target.value)}
                                placeholder="新しいパスワード"
                                className="nordic-field"
                            />
                            <input
                                type="password"
                                value={confirmPw}
                                onChange={(e) => setConfirmPw(e.target.value)}
                                placeholder="新しいパスワード（確認）"
                                className="nordic-field"
                            />

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPwOpen(false)}
                                    className="rounded-xl border border-wa-accent/20 bg-wa-ink px-4 py-2.5 text-sm font-black tracking-tight text-wa-body transition hover:border-wa-accent/35"
                                >
                                    CANCEL
                                </button>
                                    <button
                                    type="button"
                                    onClick={() => {
                                        setPwErrors({});
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
                                                    setPwErrors({});
                                                },
                                                onError: (errors) => {
                                                    setPwErrors(errors as unknown as Record<string, string[]>);
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
