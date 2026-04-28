import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useMemo, useState } from 'react';

type UserRow = {
    id: number;
    name: string;
    employee_code: string | null;
    email: string;
    role: 'admin' | 'general' | string;
    is_active?: boolean;
};

type UsersProp = {
    data: UserRow[];
};

export default function Index({ users }: { users: UsersProp }) {
    // useForm: 指示書通り、初期値も明示
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        employee_code: '',
        email: '',
        password: '',
        role: 'general' as 'admin' | 'general',
    });

    // 新規ユーザー登録送信イベント
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => reset('password'), // パスワード初期化指示書通り
        });
    };

    // データチェック（画面に取得失敗表示：指示書準拠）
    if (!users?.data) {
        return (
            <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">ADMIN / USERS</h2>}>
                <Head title="ユーザー一覧（管理者用）" />
                <div className="mx-auto max-w-6xl px-6 py-6">
                    <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.15),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-sm font-black tracking-tight">
                            ユーザー情報の取得に失敗しました
                        </div>
                        <div className="mt-2 text-sm text-rose-100/70">
                            もう一度読み込み直してください。
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const editingUser = useMemo(() => {
        if (editingUserId === null) return null;
        return users.data.find((u) => u.id === editingUserId) ?? null;
    }, [editingUserId, users.data]);

    const [editName, setEditName] = useState<string>('');
    const [editRole, setEditRole] = useState<'admin' | 'general'>('general');
    const [editActive, setEditActive] = useState<boolean>(true);

    const openEdit = (u: UserRow) => {
        setEditingUserId(u.id);
        setEditName(u.name ?? '');
        setEditRole((u.role === 'admin' ? 'admin' : 'general') as 'admin' | 'general');
        setEditActive(u.is_active !== false);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">ADMIN / USERS</h2>}>
            <Head title="ユーザー一覧（管理者用）" />

            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="mb-6 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                    <div className="pointer-events-none absolute -inset-24 bg-gradient-to-br from-purple-500/20 to-cyan-400/12 blur-3xl" />
                    <div className="relative">
                        <div className="text-xs font-bold tracking-widest text-white/60">CONTROL</div>
                        <div className="mt-2 text-lg font-black tracking-tight text-white">
                        ユーザー一覧（管理者用）
                        </div>
                    <div className="mt-1 text-sm text-white/60">
                        社員の追加・一覧確認を行います（権限制御は後で厳密化できます）。
                    </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* 左: 新規登録フォーム */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">CREATE</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-white">
                            新規ユーザー登録
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                            必須項目を入力して登録してください
                        </div>

                        <form onSubmit={submit} className="mt-5 space-y-5">
                            {/* 名前 */}
                            <div>
                                <InputLabel htmlFor="name" value="名前" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            {/* 社員コード */}
                            <div>
                                <InputLabel htmlFor="employee_code" value="社員コード" />
                                <TextInput
                                    id="employee_code"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.employee_code}
                                    onChange={e => setData('employee_code', e.target.value)}
                                />
                                <InputError message={errors.employee_code} className="mt-2" />
                            </div>
                            {/* メールアドレス */}
                            <div>
                                <InputLabel htmlFor="email" value="メールアドレス" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                            {/* パスワード */}
                            <div>
                                <InputLabel htmlFor="password" value="パスワード" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    className="mt-1 block w-full"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    required
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>
                            {/* 権限（指示書: selectによる指定） */}
                            <div>
                                <InputLabel htmlFor="role" value="権限" />
                                <select
                                    id="role"
                                    className="mt-1 block w-full rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                                    value={data.role}
                                    onChange={e => setData('role', e.target.value as 'admin' | 'general')}
                                    required
                                >
                                    <option value="general">一般</option>
                                    <option value="admin">管理者</option>
                                </select>
                                <InputError message={errors.role} className="mt-2" />
                            </div>
                            <PrimaryButton
                                className="w-full justify-center bg-gradient-to-r from-purple-500 to-cyan-400 text-[#0b1020] hover:brightness-110 shadow-[0_0_22px_rgba(34,211,238,0.22)]"
                                disabled={processing}
                            >
                                登録
                            </PrimaryButton>
                        </form>
                    </div>

                    {/* 右: 登録済みユーザー一覧 */}
                    <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">LIST</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">登録済みユーザー</div>
                            </div>
                            <div className="text-xs font-semibold text-cyan-200/80">
                                {users.data.length} 件
                            </div>
                        </div>

                        <table className="mt-4 w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-white/60">
                                    <th className="p-3 border-b border-white/10 font-bold tracking-widest">NAME</th>
                                    <th className="p-3 border-b border-white/10 font-bold tracking-widest">CODE</th>
                                    <th className="p-3 border-b border-white/10 font-bold tracking-widest">EMAIL</th>
                                    <th className="p-3 border-b border-white/10 font-bold tracking-widest">ROLE</th>
                                    <th className="p-3 border-b border-white/10 font-bold tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-sm text-white/45">
                                            ユーザーが登録されていません
                                        </td>
                                    </tr>
                                )}
                                {users.data.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 border-b border-white/10 text-sm font-black tracking-tight text-white">{user.name}</td>
                                        <td className="p-3 border-b border-white/10 text-sm text-white/70">{user.employee_code || '-'}</td>
                                        <td className="p-3 border-b border-white/10 text-sm text-white/70">{user.email}</td>
                                        <td className="p-3 border-b border-white/10 text-sm">
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (user.role === 'admin'
                                                        ? 'bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-400/25'
                                                        : 'bg-cyan-500/15 text-cyan-200 ring-1 ring-inset ring-cyan-400/25')
                                                }
                                            >
                                                {user.role === 'admin' ? '管理者' : user.role === 'general' ? '一般' : user.role}
                                            </span>
                                        </td>
                                        <td className="p-3 border-b border-white/10 text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(user)}
                                                    className="rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!confirm('このユーザーを無効化しますか？')) return;
                                                        router.delete(route('admin.users.destroy', { id: user.id }));
                                                    }}
                                                    className="rounded-2xl bg-rose-500/10 px-4 py-2 text-xs font-black tracking-tight text-rose-100 ring-1 ring-inset ring-rose-400/20 hover:bg-rose-500/15"
                                                >
                                                    無効化
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {editingUser ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0b1020]/85 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.75)] backdrop-blur-md">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">EDIT</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">
                                    ユーザー編集
                                </div>
                                <div className="mt-1 text-xs text-white/55">
                                    {editingUser.employee_code || '—'} / {editingUser.email}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/80 hover:bg-white/10"
                            >
                                CLOSE
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div>
                                <InputLabel htmlFor="edit_name" value="名前" />
                                <TextInput
                                    id="edit_name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_role" value="権限" />
                                <select
                                    id="edit_role"
                                    className="mt-1 block w-full rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value as 'admin' | 'general')}
                                >
                                    <option value="general">一般</option>
                                    <option value="admin">管理者</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-white/75">
                                <input
                                    type="checkbox"
                                    checked={editActive}
                                    onChange={(e) => setEditActive(e.target.checked)}
                                />
                                有効
                            </label>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingUserId(null)}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black tracking-tight text-white/80 hover:bg-white/10"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.patch(route('admin.users.update', { id: editingUser.id }), {
                                            name: editName,
                                            role: editRole,
                                            is_active: editActive,
                                        });
                                        setEditingUserId(null);
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