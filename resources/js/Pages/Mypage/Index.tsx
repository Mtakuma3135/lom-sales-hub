import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import NeonCard from '@/Components/NeonCard';

type MypagePayload = {
    data: {
        profile: { name: string; employee_code: string | null; role: string };
        attendance?: { has_error: boolean; error_dates: string[]; cached_at: string } | null;
        integrations: { key: string; label: string; status: string }[];
        quick_links: { label: string; href: string }[];
    };
};

const btnPrimary =
    'rounded-sm border border-wa-accent/45 bg-wa-accent px-3 py-3 text-sm font-black tracking-tight text-wa-ink transition hover:bg-wa-accent/90';
const btnGhost =
    'rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-3 text-sm font-black tracking-tight text-wa-body transition hover:border-wa-accent/40';

export default function Index({ mypage }: { mypage?: MypagePayload }) {
    const profile =
        mypage?.data.profile ??
        ({
            name: 'ゲストユーザー',
            employee_code: null,
            role: 'general',
        } as const);

    const integrations =
        mypage?.data.integrations ??
        [
            { key: 'king_of_time', label: 'KING OF TIME', status: 'connected' },
            { key: 'discord', label: 'Discord（通知）', status: 'not_connected' },
        ];

    const links =
        mypage?.data.quick_links ??
        [
            { label: '勤怠管理', href: '#' },
            { label: '商材一覧', href: '#' },
            { label: '周知事項', href: '#' },
            { label: '業務依頼', href: '#' },
        ];

    const attendance = mypage?.data.attendance ?? null;

    const [pwOpen, setPwOpen] = useState<boolean>(false);
    const [currentPw, setCurrentPw] = useState<string>('');
    const [newPw, setNewPw] = useState<string>('');
    const [confirmPw, setConfirmPw] = useState<string>('');

    const [kotLoading, setKotLoading] = useState<boolean>(false);
    const [kotPulse, setKotPulse] = useState<boolean>(false);
    const [kotMessage, setKotMessage] = useState<string | null>(null);
    const [kotPending, setKotPending] = useState<boolean>(false);

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">MY / CONSOLE</h2>}>
            <Head title="マイページ" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-wa-body wa-body-track">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard>
                        <div className="text-xs font-bold tracking-widest text-wa-muted">PROFILE</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-wa-body">ユーザー</div>
                        <div className="mt-4 space-y-2">
                            <div className="text-2xl font-black tracking-tighter text-wa-body">{profile.name}</div>
                            <div className="text-sm font-semibold text-wa-muted">
                                社員コード: {profile.employee_code ?? '-'}
                            </div>
                            <div className="text-sm font-semibold text-wa-muted">権限: {profile.role}</div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <button type="button" className={btnPrimary}>
                                連携設定
                            </button>
                            <button type="button" onClick={() => setPwOpen(true)} className={btnGhost}>
                                パスワード変更
                            </button>
                        </div>
                    </NeonCard>

                    <div className="space-y-6 lg:col-span-2">
                        <NeonCard elevate={false}>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">ATTENDANCE</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-wa-body">勤怠エラー</div>

                            {attendance ? (
                                attendance.has_error ? (
                                    <div className="mt-4 rounded-sm border border-red-500/35 bg-red-950/40 p-4">
                                        <div className="text-sm font-black tracking-tight text-red-200">エラーあり</div>
                                        <div className="mt-2 text-xs text-red-300">cached_at: {attendance.cached_at}</div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {attendance.error_dates.map((d) => (
                                                <span
                                                    key={d}
                                                    className="inline-flex items-center rounded-sm border border-red-500/35 bg-red-950/50 px-3 py-1 text-xs font-black tracking-tight text-red-200"
                                                >
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-sm border border-teal-500/35 bg-wa-ink p-4">
                                        <div className="text-sm font-black tracking-tight text-teal-200">エラーなし</div>
                                        <div className="mt-2 text-xs text-teal-300">cached_at: {attendance.cached_at}</div>
                                    </div>
                                )
                            ) : (
                                <div className="mt-4 rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-4 text-sm text-wa-muted">
                                    （未取得）
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between gap-3">
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
                                        kotLoading
                                            ? 'rounded-sm px-4 py-2 text-xs font-black tracking-widest bg-wa-ink text-wa-muted ring-1 ring-wa-accent/20'
                                            : kotPending
                                              ? 'rounded-sm border border-wa-accent/25 bg-wa-card px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/40'
                                              : 'rounded-sm border border-wa-accent/45 bg-wa-accent px-4 py-2 text-xs font-black tracking-widest text-wa-ink transition hover:bg-wa-accent/90' +
                                                (kotPulse ? ' animate-pulse' : '')
                                    }
                                >
                                    {kotLoading ? 'LOADING…' : kotPending ? 'KOT 再試行' : 'KOT 打刻'}
                                </button>
                                <div className="text-xs text-wa-muted">{kotMessage ?? '—'}</div>
                            </div>
                        </NeonCard>

                        <NeonCard elevate={false}>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">INTEGRATIONS</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-wa-body">外部連携</div>
                            <div className="mt-3 rounded-sm border border-wa-accent/20 bg-wa-ink px-3 py-3 text-xs text-wa-muted">
                                このセクションは閲覧のみです（編集不可）
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {integrations.map((i) => (
                                    <div
                                        key={i.key}
                                        className="rounded-sm border border-wa-accent/20 bg-wa-card p-4 opacity-90"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-black tracking-tight text-wa-body">{i.label}</div>
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (i.status === 'connected'
                                                        ? 'border border-teal-500/35 bg-wa-ink text-teal-300'
                                                        : 'border border-wa-accent/20 bg-wa-ink text-wa-muted')
                                                }
                                            >
                                                {i.status === 'connected' ? '接続中' : '未接続'}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-sm border border-wa-accent/15 bg-wa-ink px-4 py-2 text-xs font-black tracking-tight text-wa-muted"
                                            >
                                                詳細
                                            </button>
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-sm border border-wa-accent/15 bg-wa-ink px-4 py-2 text-xs font-black tracking-tight text-wa-muted"
                                            >
                                                接続
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </NeonCard>

                        <NeonCard elevate={false}>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">QUICK</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-wa-body">よく使うリンク</div>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {links.map((l) => (
                                    <button
                                        key={l.label}
                                        type="button"
                                        className="group relative overflow-hidden rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-4 text-left transition hover:border-wa-accent/35"
                                    >
                                        <div className="relative text-sm font-black tracking-tight text-wa-body">{l.label}</div>
                                        <div className="relative mt-1 text-xs text-wa-muted">
                                            {l.href === '#' ? 'Mock' : l.href}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </NeonCard>
                    </div>
                </div>
            </div>
            {pwOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-wa-ink/75 p-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-xl rounded-sm border border-wa-accent/20 bg-wa-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">PASSWORD</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-wa-body">パスワード変更</div>
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
