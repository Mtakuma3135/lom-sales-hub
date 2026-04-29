import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import NeonCard from '@/Components/NeonCard';
import { useMemo, useState } from 'react';

type UserRow = {
    id: number;
    name: string;
    employee_code: string | null;
    email: string;
    role: 'admin' | 'general' | string;
    is_active?: boolean;
    department?: { id: number; name: string; code: string } | null;
};

type UsersProp = {
    data: UserRow[];
};

export default function Index({ users }: { users: UsersProp }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        employee_code: '',
        email: '',
        password: '',
        role: 'general' as 'admin' | 'general',
        department_id: '' as string,
    });

    const [departments, setDepartments] = useState<Array<{ id: number; name: string; code: string }>>([]);
    const [departmentsLoaded, setDepartmentsLoaded] = useState<boolean>(false);

    const loadDepartments = async () => {
        if (departmentsLoaded) return;
        try {
            const res = await fetch(route('portal.api.departments.index'), { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as Array<{ id: number; name: string; code: string }>;
            setDepartments(Array.isArray(json) ? json : []);
            setDepartmentsLoaded(true);
        } catch {
            setDepartments([]);
            setDepartmentsLoaded(true);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => reset('password'),
        });
    };

    if (!users?.data) {
        return (
            <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">ADMIN / USERS</h2>}>
                <Head title="ユーザー一覧（管理者用）" />
                <div className="mx-auto max-w-6xl px-6 py-6">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
                        <div className="text-sm font-black tracking-tight">ユーザー情報の取得に失敗しました</div>
                        <div className="mt-2 text-sm text-rose-800">もう一度読み込み直してください。</div>
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
    const [editDepartmentId, setEditDepartmentId] = useState<string>('');

    const openEdit = (u: UserRow) => {
        setEditingUserId(u.id);
        setEditName(u.name ?? '');
        setEditRole((u.role === 'admin' ? 'admin' : 'general') as 'admin' | 'general');
        setEditActive(u.is_active !== false);
        setEditDepartmentId(u.department?.id ? String(u.department.id) : '');
        void loadDepartments();
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">ADMIN / USERS</h2>}>
            <Head title="ユーザー一覧（管理者用）" />

            <div className="mx-auto max-w-6xl px-6 py-6 text-stone-800">
                <NeonCard className="mb-6" elevate={false}>
                    <div className="text-xs font-bold tracking-widest text-stone-500">CONTROL</div>
                    <div className="mt-2 text-lg font-black tracking-tight text-stone-900">ユーザー一覧（管理者用）</div>
                    <div className="mt-1 text-sm text-stone-600">
                        社員の追加・一覧確認を行います（権限制御は後で厳密化できます）。
                    </div>
                </NeonCard>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard elevate={false}>
                        <div className="text-xs font-bold tracking-widest text-stone-500">CREATE</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-stone-900">新規ユーザー登録</div>
                        <div className="mt-1 text-xs text-stone-600">必須項目を入力して登録してください</div>

                        <form onSubmit={submit} className="mt-5 space-y-5">
                            <div>
                                <InputLabel htmlFor="name" value="名前" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="employee_code" value="社員コード" />
                                <TextInput
                                    id="employee_code"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.employee_code}
                                    onChange={(e) => setData('employee_code', e.target.value)}
                                />
                                <InputError message={errors.employee_code} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value="メールアドレス" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="password" value="パスワード" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    className="mt-1 block w-full"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="role" value="権限" />
                                <select
                                    id="role"
                                    className="nordic-field mt-1 block w-full"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value as 'admin' | 'general')}
                                    required
                                >
                                    <option value="general">一般</option>
                                    <option value="admin">管理者</option>
                                </select>
                                <InputError message={errors.role} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="department_id" value="部署" />
                                <select
                                    id="department_id"
                                    onFocus={() => void loadDepartments()}
                                    className="nordic-field mt-1 block w-full"
                                    value={data.department_id}
                                    onChange={(e) => setData('department_id', e.target.value)}
                                >
                                    <option value="">未設定</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={String(d.id)}>
                                            {d.name} ({d.code})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={(errors as any).department_id} className="mt-2" />
                            </div>
                            <PrimaryButton className="w-full justify-center" disabled={processing}>
                                登録
                            </PrimaryButton>
                        </form>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2 overflow-x-auto" elevate={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-stone-500">LIST</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-stone-900">登録済みユーザー</div>
                            </div>
                            <div className="text-xs font-semibold text-emerald-700">{users.data.length} 件</div>
                        </div>

                        <table className="mt-4 w-full border-collapse text-left">
                            <thead>
                                <tr className="text-xs text-stone-500">
                                    <th className="border-b border-stone-200 p-3 font-bold tracking-widest">NAME</th>
                                    <th className="border-b border-stone-200 p-3 font-bold tracking-widest">CODE</th>
                                    <th className="border-b border-stone-200 p-3 font-bold tracking-widest">EMAIL</th>
                                    <th className="border-b border-stone-200 p-3 font-bold tracking-widest">ROLE</th>
                                    <th className="border-b border-stone-200 p-3 font-bold tracking-widest">DEPT</th>
                                    <th className="border-b border-stone-200 p-3 font-bold tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-sm text-stone-500">
                                            ユーザーが登録されていません
                                        </td>
                                    </tr>
                                )}
                                {users.data.map((user) => (
                                    <tr key={user.id} className="transition-colors hover:bg-white/70">
                                        <td className="border-b border-stone-200 p-3 text-sm font-black tracking-tight text-stone-900">
                                            {user.name}
                                        </td>
                                        <td className="border-b border-stone-200 p-3 text-sm text-stone-600">
                                            {user.employee_code || '-'}
                                        </td>
                                        <td className="border-b border-stone-200 p-3 text-sm text-stone-600">{user.email}</td>
                                        <td className="border-b border-stone-200 p-3 text-sm">
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (user.role === 'admin'
                                                        ? 'bg-violet-50 text-violet-800 ring-1 ring-inset ring-violet-200'
                                                        : 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200')
                                                }
                                            >
                                                {user.role === 'admin' ? '管理者' : user.role === 'general' ? '一般' : user.role}
                                            </span>
                                        </td>
                                        <td className="border-b border-stone-200 p-3 text-sm text-stone-600">
                                            {user.department ? (
                                                <span className="font-mono text-xs">{user.department.name}</span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="border-b border-stone-200 p-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(user)}
                                                    className="rounded-xl border border-stone-200 bg-white/90 px-4 py-2 text-xs font-black tracking-tight text-stone-700 shadow-sm hover:bg-emerald-50/50"
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!confirm('このユーザーを無効化しますか？')) return;
                                                        router.delete(route('admin.users.destroy', { id: user.id }));
                                                    }}
                                                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black tracking-tight text-rose-800 ring-1 ring-rose-200/80 hover:bg-rose-100/80"
                                                >
                                                    無効化
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </NeonCard>
                </div>
            </div>

            {editingUser ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-2xl border border-emerald-100/70 bg-emerald-50/50 p-6 shadow-nordic ring-1 ring-stone-900/5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-stone-500">EDIT</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-stone-900">ユーザー編集</div>
                                <div className="mt-1 text-xs text-stone-600">
                                    {editingUser.employee_code || '—'} / {editingUser.email}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="rounded-xl border border-stone-200 bg-white/90 px-4 py-2 text-xs font-black tracking-widest text-stone-700 shadow-sm hover:bg-stone-50"
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
                                    className="nordic-field mt-1 block w-full"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value as 'admin' | 'general')}
                                >
                                    <option value="general">一般</option>
                                    <option value="admin">管理者</option>
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_department_id" value="部署" />
                                <select
                                    id="edit_department_id"
                                    className="nordic-field mt-1 block w-full"
                                    value={editDepartmentId}
                                    onChange={(e) => setEditDepartmentId(e.target.value)}
                                >
                                    <option value="">未設定</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={String(d.id)}>
                                            {d.name} ({d.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                                <input
                                    type="checkbox"
                                    checked={editActive}
                                    onChange={(e) => setEditActive(e.target.checked)}
                                    className="rounded border-stone-300 text-emerald-600"
                                />
                                有効
                            </label>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingUserId(null)}
                                    className="rounded-xl border border-stone-200 bg-white/90 px-4 py-2.5 text-sm font-black tracking-tight text-stone-700 shadow-sm hover:bg-stone-50"
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
                                            department_id: editDepartmentId ? Number(editDepartmentId) : null,
                                        });
                                        setEditingUserId(null);
                                    }}
                                    className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-black tracking-tight text-white shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/25 transition hover:from-emerald-500/95 hover:to-emerald-600/95"
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
