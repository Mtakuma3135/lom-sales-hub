import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type MypagePayload = {
    data: {
        profile: { name: string; employee_code: string | null; role: string };
        attendance?: { has_error: boolean; error_dates: string[]; cached_at: string } | null;
        integrations: { key: string; label: string; status: string }[];
        quick_links: { label: string; href: string }[];
    };
};

export default function Index({ mypage }: { mypage?: MypagePayload }) {
    const profile =
        mypage?.data.profile ?? ({
            name: 'ゲストユーザー',
            employee_code: null,
            role: 'general',
        } as const);

    const integrations =
        mypage?.data.integrations ??
        [
            { key: 'king_of_time', label: 'KING OF TIME', status: 'connected' },
            { key: 'google_chat', label: 'Google Chat', status: 'not_connected' },
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
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">MY / CONSOLE</h2>}>
            <Head title="マイページ" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* 左：プロフィール */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="pointer-events-none absolute -inset-24 bg-gradient-to-br from-purple-500/20 to-cyan-400/12 blur-3xl" />
                        <div className="relative">
                            <div className="text-xs font-bold tracking-widest text-white/60">PROFILE</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-white">ユーザー</div>
                        <div className="mt-4 space-y-2">
                            <div className="text-2xl font-black tracking-tighter text-white">
                                {profile.name}
                            </div>
                            <div className="text-sm font-semibold text-white/70">
                                社員コード: {profile.employee_code ?? '-'}
                            </div>
                            <div className="text-sm font-semibold text-white/70">
                                権限: {profile.role}
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-3 py-3 text-sm font-black tracking-tight text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110"
                            >
                                連携設定
                            </button>
                            <button
                                type="button"
                                onClick={() => setPwOpen(true)}
                                className="rounded-2xl bg-white/5 px-3 py-3 text-sm font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                            >
                                パスワード変更
                            </button>
                        </div>
                        </div>
                    </div>

                    {/* 右：連携状況 + リンク */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                            <div className="text-xs font-bold tracking-widest text-white/60">ATTENDANCE</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-white">勤怠エラー</div>

                            {attendance ? (
                                attendance.has_error ? (
                                    <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
                                        <div className="text-sm font-black tracking-tight text-rose-100">
                                            エラーあり
                                        </div>
                                        <div className="mt-2 text-xs text-rose-100/70">
                                            cached_at: {attendance.cached_at}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {attendance.error_dates.map((d) => (
                                                <span
                                                    key={d}
                                                    className="inline-flex items-center rounded-full bg-rose-500/15 px-3 py-1 text-xs font-black tracking-tight text-rose-100 ring-1 ring-inset ring-rose-400/25"
                                                >
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                                        <div className="text-sm font-black tracking-tight text-emerald-100">
                                            エラーなし
                                        </div>
                                        <div className="mt-2 text-xs text-emerald-100/70">
                                            cached_at: {attendance.cached_at}
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1020]/55 px-4 py-4 text-sm text-white/45">
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
                                                // 1分ロックを前提に、操作ガードを自動解除
                                                setTimeout(() => setKotPending(false), 65_000);
                                            }
                                        } catch {
                                            setKotMessage('通信に失敗しました');
                                        } finally {
                                            setKotLoading(false);
                                        }
                                    }}
                                    className={
                                        'rounded-2xl px-4 py-2 text-xs font-black tracking-widest shadow-[0_0_22px_rgba(34,211,238,0.22)] transition ' +
                                        (kotLoading
                                            ? 'bg-white/5 text-white/60 ring-1 ring-inset ring-white/10'
                                            : kotPending
                                              ? 'bg-white/5 text-white/80 ring-1 ring-inset ring-white/10 hover:bg-white/10'
                                              : 'bg-gradient-to-r from-purple-500 to-cyan-400 text-[#0b1020] hover:brightness-110') +
                                        (kotPulse ? ' animate-pulse' : '')
                                    }
                                >
                                    {kotLoading ? 'LOADING…' : kotPending ? 'KOT 再試行' : 'KOT 打刻'}
                                </button>
                                <div className="text-xs text-white/55">
                                    {kotMessage ?? '—'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                            <div className="text-xs font-bold tracking-widest text-white/60">INTEGRATIONS</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-white">外部連携</div>
                            <div className="mt-3 rounded-xl border border-white/10 bg-[#0b1020]/60 px-3 py-3 text-xs text-white/55">
                                このセクションは閲覧のみです（編集不可）
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {integrations.map((i) => (
                                    <div
                                        key={i.key}
                                        className="rounded-2xl border border-white/10 bg-[#0b1020]/55 p-4 opacity-60 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-black tracking-tight text-white">
                                                {i.label}
                                            </div>
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (i.status === 'connected'
                                                        ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/25'
                                                        : 'bg-white/5 text-white/70 ring-1 ring-inset ring-white/10')
                                                }
                                            >
                                                {i.status === 'connected' ? '接続中' : '未接続'}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                                            >
                                                詳細
                                            </button>
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                                            >
                                                接続
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                            <div className="text-xs font-bold tracking-widest text-white/60">QUICK</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-white">よく使うリンク</div>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {links.map((l) => (
                                    <button
                                        key={l.label}
                                        type="button"
                                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/55 px-4 py-4 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_0_1px_rgba(34,211,238,0.20),0_0_26px_rgba(168,85,247,0.14)]"
                                    >
                                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-400/10" />
                                        <div className="relative text-sm font-black tracking-tight text-white">
                                            {l.label}
                                        </div>
                                        <div className="relative mt-1 text-xs text-white/45">
                                            {l.href === '#' ? 'Mock' : l.href}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {pwOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0b1020]/85 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.75)] backdrop-blur-md">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">PASSWORD</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">パスワード変更</div>
                                <div className="mt-1 text-xs text-white/55">
                                    8文字以上・英大/小/数字を含めてください
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPwOpen(false)}
                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/80 hover:bg-white/10"
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
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                            />
                            <input
                                type="password"
                                value={newPw}
                                onChange={(e) => setNewPw(e.target.value)}
                                placeholder="新しいパスワード"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                            />
                            <input
                                type="password"
                                value={confirmPw}
                                onChange={(e) => setConfirmPw(e.target.value)}
                                placeholder="新しいパスワード（確認）"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors focus:bg-white focus:text-black"
                            />

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPwOpen(false)}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black tracking-tight text-white/80 hover:bg-white/10"
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
                                    className="rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2.5 text-sm font-black tracking-tight text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110"
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

