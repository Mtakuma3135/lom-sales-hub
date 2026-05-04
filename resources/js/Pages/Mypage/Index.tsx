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
    'rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-3 py-3 text-sm font-black tracking-tight text-white shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/25 transition hover:from-emerald-500/95 hover:to-emerald-600/95';
const btnGhost =
    'rounded-xl border border-stone-200 bg-white/90 px-3 py-3 text-sm font-black tracking-tight text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50';

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
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">MY / CONSOLE</h2>}>
            <Head title="マイページ" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-stone-800">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard>
                        <div className="text-xs font-bold tracking-widest text-stone-500">PROFILE</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-stone-900">ユーザー</div>
                        <div className="mt-4 space-y-2">
                            <div className="text-2xl font-black tracking-tighter text-stone-900">{profile.name}</div>
                            <div className="text-sm font-semibold text-stone-600">
                                社員コード: {profile.employee_code ?? '-'}
                            </div>
                            <div className="text-sm font-semibold text-stone-600">権限: {profile.role}</div>
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
                            <div className="text-xs font-bold tracking-widest text-stone-500">ATTENDANCE</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-stone-900">勤怠エラー</div>

                            {attendance ? (
                                attendance.has_error ? (
                                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                                        <div className="text-sm font-black tracking-tight text-rose-900">エラーあり</div>
                                        <div className="mt-2 text-xs text-rose-800">cached_at: {attendance.cached_at}</div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {attendance.error_dates.map((d) => (
                                                <span
                                                    key={d}
                                                    className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-black tracking-tight text-rose-900 ring-1 ring-inset ring-rose-200"
                                                >
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                        <div className="text-sm font-black tracking-tight text-emerald-900">エラーなし</div>
                                        <div className="mt-2 text-xs text-emerald-800">cached_at: {attendance.cached_at}</div>
                                    </div>
                                )
                            ) : (
                                <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-500">
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
                                            ? 'rounded-xl px-4 py-2 text-xs font-black tracking-widest bg-stone-100 text-stone-500 ring-1 ring-stone-200'
                                            : kotPending
                                              ? 'rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-black tracking-widest text-stone-700 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50'
                                              : 'rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-black tracking-widest text-white shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/25 transition hover:from-emerald-500/95 hover:to-emerald-600/95' +
                                                (kotPulse ? ' animate-pulse' : '')
                                    }
                                >
                                    {kotLoading ? 'LOADING…' : kotPending ? 'KOT 再試行' : 'KOT 打刻'}
                                </button>
                                <div className="text-xs text-stone-500">{kotMessage ?? '—'}</div>
                            </div>
                        </NeonCard>

                        <NeonCard elevate={false}>
                            <div className="text-xs font-bold tracking-widest text-stone-500">INTEGRATIONS</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-stone-900">外部連携</div>
                            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-xs text-stone-600">
                                このセクションは閲覧のみです（編集不可）
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {integrations.map((i) => (
                                    <div
                                        key={i.key}
                                        className="rounded-xl border border-stone-200 bg-white/70 p-4 opacity-90 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-black tracking-tight text-stone-900">{i.label}</div>
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (i.status === 'connected'
                                                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200'
                                                        : 'bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200')
                                                }
                                            >
                                                {i.status === 'connected' ? '接続中' : '未接続'}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-black tracking-tight text-stone-400"
                                            >
                                                詳細
                                            </button>
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-black tracking-tight text-stone-400"
                                            >
                                                接続
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </NeonCard>

                        <NeonCard elevate={false}>
                            <div className="text-xs font-bold tracking-widest text-stone-500">QUICK</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-stone-900">よく使うリンク</div>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {links.map((l) => (
                                    <button
                                        key={l.label}
                                        type="button"
                                        className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white/80 px-4 py-4 text-left shadow-sm transition hover:border-emerald-200/80 hover:shadow-nordic"
                                    >
                                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-emerald-400/5 via-transparent to-teal-400/5" />
                                        <div className="relative text-sm font-black tracking-tight text-stone-900">{l.label}</div>
                                        <div className="relative mt-1 text-xs text-stone-500">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-2xl border border-emerald-100/70 bg-emerald-50/50 p-6 shadow-nordic ring-1 ring-stone-900/5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-stone-500">PASSWORD</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-stone-900">パスワード変更</div>
                                <div className="mt-1 text-xs text-stone-600">
                                    8文字以上・英大/小/数字を含めてください
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPwOpen(false)}
                                className="rounded-xl border border-stone-200 bg-white/90 px-4 py-2 text-xs font-black tracking-widest text-stone-700 shadow-sm hover:bg-stone-50"
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
                                    className="rounded-xl border border-stone-200 bg-white/90 px-4 py-2.5 text-sm font-black tracking-tight text-stone-700 shadow-sm hover:bg-stone-50"
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
