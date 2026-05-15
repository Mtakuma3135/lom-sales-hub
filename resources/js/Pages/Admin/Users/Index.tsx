import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import NeonCard from '@/Components/NeonCard';
import { useEffect, useMemo, useState } from 'react';
import { nextDir, type SortDir, SortableTh } from '@/Components/SortableTh';

type UserRow = {
    id: number;
    name: string;
    employee_code: string | null;
    email: string | null;
    role: 'admin' | 'general' | string;
    is_active?: boolean;
    internal_policy_explained_at?: string | null;
    internal_policy_version?: string | null;
    department?: { id: number; name: string; code: string } | null;
};

type UsersProp = {
    data: UserRow[];
};

const USER_SORT_KEYS = ['name', 'employee_code', 'role'] as const;
type UserSortKey = (typeof USER_SORT_KEYS)[number];

function readUsersSortFromUrl(): { key: UserSortKey; dir: SortDir } {
    const p = new URLSearchParams(window.location.search);
    const raw = p.get('sort') ?? 'name';
    const key = (USER_SORT_KEYS as readonly string[]).includes(raw) ? (raw as UserSortKey) : 'name';
    const dir = (p.get('dir') ?? 'asc') === 'desc' ? 'desc' : 'asc';
    return { key, dir };
}

function writeUsersSortUrl(key: UserSortKey, dir: SortDir) {
    const p = new URLSearchParams(window.location.search);
    p.set('sort', key);
    p.set('dir', dir);
    window.history.replaceState({}, '', `${window.location.pathname}?${p.toString()}`);
}

export default function Index({ users }: { users: UsersProp }) {
    const page = usePage<{ errors?: Record<string, string> }>();
    const pageErrors = page.props.errors ?? {};

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        employee_code: '',
        password: '',
        role: 'general' as 'admin' | 'general',
        internal_policy_explained: false,
    });

    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 15;

    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const editingUser = useMemo(() => {
        if (editingUserId === null) return null;
        return users.data.find((u) => u.id === editingUserId) ?? null;
    }, [editingUserId, users.data]);

    const [editName, setEditName] = useState<string>('');
    const [editEmployeeCode, setEditEmployeeCode] = useState<string>('');
    const [editPassword, setEditPassword] = useState<string>('');
    const [editRole, setEditRole] = useState<'admin' | 'general'>('general');
    const [editActive, setEditActive] = useState<boolean>(true);
    const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const [sort, setSort] = useState<{ key: UserSortKey; dir: SortDir }>(() => readUsersSortFromUrl());

    useEffect(() => {
        writeUsersSortUrl(sort.key, sort.dir);
    }, [sort.key, sort.dir]);

    useEffect(() => {
        const onPop = () => setSort(readUsersSortFromUrl());
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    const sortedUsers = useMemo(() => {
        const sign = sort.dir === 'asc' ? 1 : -1;
        const key = sort.key;
        return [...users.data].sort((a, b) => {
            const av = a[key] ?? '';
            const bv = b[key] ?? '';
            return String(av).localeCompare(String(bv), 'ja') * sign;
        });
    }, [sort.dir, sort.key, users.data]);

    const toggleSort = (key: UserSortKey) => {
        setCurrentPage(0);
        setSort((s) => {
            if (s.key !== key) return { key, dir: 'asc' };
            return { key, dir: nextDir(s.dir) };
        });
    };

    const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE);
    const pagedUsers = sortedUsers.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const openEdit = (u: UserRow) => {
        setEditingUserId(u.id);
        setEditName(u.name ?? '');
        setEditEmployeeCode(u.employee_code ?? '');
        setEditPassword('');
        setEditRole((u.role === 'admin' ? 'admin' : 'general') as 'admin' | 'general');
        setEditActive(u.is_active !== false);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => reset(),
        });
    };

    const errorMap: Record<string, string> = {
        name: 'お名前を入力してください',
        employee_code: '社員コードを入力してください',
        password: 'パスワードを入力してください（8文字以上）',
        role: '権限を選択してください',
        internal_policy_explained: '利用規程の説明済みチェックが必要です',
    };

    const translateError = (field: string, msg: string | undefined): string | undefined => {
        if (!msg) return undefined;
        return errorMap[field] ?? msg;
    };

    if (!users?.data) {
        return (
            <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">ADMIN / USERS</h2>}>
                <Head title="ユーザー一覧（管理者用）" />
                <div className="mx-auto max-w-6xl px-6 py-6">
                    <div className="rounded-sm border border-red-500/35 bg-wa-ink p-6 text-red-200">
                        <div className="text-sm font-black tracking-tight">ユーザー情報の取得に失敗しました</div>
                        <div className="mt-2 text-sm text-red-300/90">もう一度読み込み直してください。</div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">ADMIN / USERS</h2>}>
            <Head title="ユーザー一覧（管理者用）" />

            <div className="mx-auto max-w-6xl px-6 py-6 text-wa-body wa-body-track">
                <NeonCard className="mb-6" elevate={false}>
                    <div className="text-xs font-bold tracking-widest text-wa-muted">CONTROL</div>
                    <div className="mt-2 text-lg font-black tracking-tight text-wa-body">ユーザー一覧（管理者用）</div>
                    <div className="mt-1 text-sm text-wa-muted">
                        社員コードとパスワードでログインします（メール・部署は使いません）。
                    </div>
                </NeonCard>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard elevate={false}>
                        <div className="text-xs font-bold tracking-widest text-wa-muted">CREATE</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-wa-body">新規ユーザー登録</div>
                        <div className="mt-1 text-xs text-wa-muted">
                            社内ポータル利用規程と個人情報の取り扱いを説明したうえで登録します
                        </div>

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
                                <InputError message={translateError('name', errors.name)} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="employee_code" value="社員コード（ログインID）" />
                                <TextInput
                                    id="employee_code"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.employee_code}
                                    onChange={(e) => setData('employee_code', e.target.value)}
                                    required
                                />
                                <InputError message={translateError('employee_code', errors.employee_code)} className="mt-2" />
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
                                <InputError message={translateError('password', errors.password)} className="mt-2" />
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
                                <InputError message={translateError('role', errors.role)} className="mt-2" />
                            </div>
                            <label className="block rounded-sm border border-wa-accent/20 bg-wa-ink/70 p-4 text-sm text-wa-body">
                                <span className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.internal_policy_explained}
                                        onChange={(e) => setData('internal_policy_explained', e.target.checked)}
                                        className="mt-1 rounded-sm border-wa-accent/35 text-wa-accent"
                                        required
                                    />
                                    <span>
                                        <span className="block font-black tracking-tight">
                                            社内ポータル利用規程・個人情報取り扱い説明済み
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-wa-muted">
                                            業務上必要な氏名・社員コード・操作履歴等を社内ポータルで利用し、
                                            監査・不正アクセス防止・運用改善のため記録されることを説明済みです。
                                        </span>
                                    </span>
                                </span>
                                <InputError message={errors.internal_policy_explained} className="mt-2" />
                            </label>
                            <PrimaryButton className="w-full justify-center" disabled={processing}>
                                登録
                            </PrimaryButton>
                        </form>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2 overflow-x-auto" elevate={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">LIST</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-wa-body">登録済みユーザー</div>
                            </div>
                            <div className="text-xs font-semibold text-wa-accent">{users.data.length} 件</div>
                        </div>

                        <table className="mt-4 w-full border-collapse text-left">
                            <thead>
                                <tr className="text-xs text-wa-muted">
                                    <SortableTh
                                        label="NAME"
                                        active={sort.key === 'name'}
                                        dir={sort.dir}
                                        onToggle={() => toggleSort('name')}
                                        className="border-b border-wa-accent/20 p-3 font-bold tracking-widest"
                                    />
                                    <SortableTh
                                        label="CODE"
                                        active={sort.key === 'employee_code'}
                                        dir={sort.dir}
                                        onToggle={() => toggleSort('employee_code')}
                                        className="border-b border-wa-accent/20 p-3 font-bold tracking-widest"
                                    />
                                    <SortableTh
                                        label="ROLE"
                                        active={sort.key === 'role'}
                                        dir={sort.dir}
                                        onToggle={() => toggleSort('role')}
                                        className="border-b border-wa-accent/20 p-3 font-bold tracking-widest"
                                    />
                                    <th className="border-b border-wa-accent/20 p-3 font-bold tracking-widest">STATUS</th>
                                    <th className="border-b border-wa-accent/20 p-3 font-bold tracking-widest">POLICY</th>
                                    <th className="border-b border-wa-accent/20 p-3 font-bold tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-sm text-wa-muted">
                                            ユーザーが登録されていません
                                        </td>
                                    </tr>
                                )}
                                {pagedUsers.map((user) => (
                                    <tr key={user.id} className="transition-colors hover:bg-wa-ink/80">
                                        <td className="border-b border-wa-accent/20 p-3 text-sm font-black tracking-tight text-wa-body">
                                            {user.name}
                                        </td>
                                        <td className="border-b border-wa-accent/20 p-3 text-sm text-wa-muted">
                                            {user.employee_code || '-'}
                                        </td>
                                        <td className="border-b border-wa-accent/20 p-3 text-sm">
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (user.role === 'admin'
                                                        ? 'border border-violet-500/35 bg-wa-ink text-violet-300 ring-1 ring-inset ring-violet-500/25'
                                                        : 'border border-teal-500/35 bg-wa-ink text-teal-300 ring-1 ring-inset ring-teal-500/25')
                                                }
                                            >
                                                {user.role === 'admin' ? '管理者' : user.role === 'general' ? '一般' : user.role}
                                            </span>
                                        </td>
                                        <td className="border-b border-wa-accent/20 p-3 text-sm">
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (user.is_active === false
                                                        ? 'border border-red-500/35 bg-wa-ink text-red-300 ring-1 ring-inset ring-red-500/25'
                                                        : 'border border-teal-500/35 bg-wa-ink text-teal-300 ring-1 ring-inset ring-teal-500/25')
                                                }
                                            >
                                                {user.is_active === false ? '無効' : '有効'}
                                            </span>
                                        </td>
                                        <td className="border-b border-wa-accent/20 p-3 text-sm">
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    (user.internal_policy_explained_at
                                                        ? 'border border-emerald-500/35 bg-wa-ink text-emerald-300 ring-1 ring-inset ring-emerald-500/25'
                                                        : 'border border-amber-500/35 bg-wa-ink text-amber-300 ring-1 ring-inset ring-amber-500/25')
                                                }
                                                title={user.internal_policy_version ? `規程バージョン: ${user.internal_policy_version}` : undefined}
                                            >
                                                {user.internal_policy_explained_at ? '説明済み' : '未確認'}
                                            </span>
                                        </td>
                                        <td className="border-b border-wa-accent/20 p-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(user)}
                                                    className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/45"
                                                >
                                                    編集
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between gap-2">
                                <span className="text-xs text-wa-muted">
                                    {currentPage * PAGE_SIZE + 1}〜{Math.min((currentPage + 1) * PAGE_SIZE, sortedUsers.length)} / {sortedUsers.length} 件
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        disabled={currentPage === 0}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className="rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-1.5 text-xs font-black text-wa-body transition hover:border-wa-accent/40 disabled:opacity-30"
                                    >
                                        ← 前
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setCurrentPage(i)}
                                            className={
                                                'rounded-sm border px-3 py-1.5 text-xs font-black transition ' +
                                                (i === currentPage
                                                    ? 'border-wa-accent/50 bg-wa-accent text-wa-ink'
                                                    : 'border-wa-accent/25 bg-wa-ink text-wa-body hover:border-wa-accent/40')
                                            }
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages - 1}
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        className="rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-1.5 text-xs font-black text-wa-body transition hover:border-wa-accent/40 disabled:opacity-30"
                                    >
                                        次 →
                                    </button>
                                </div>
                            </div>
                        )}
                    </NeonCard>
                </div>
            </div>

            {editingUser ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-wa-ink/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-sm border border-wa-accent/25 bg-wa-card p-6 shadow-xl shadow-black/50 ring-1 ring-wa-accent/10">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-wa-muted">EDIT</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-wa-body">ユーザー編集</div>
                                <div className="mt-1 text-xs text-wa-muted">ID: {editingUser.id}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingUserId(null);
                                }}
                                className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-widest text-wa-body transition hover:border-wa-accent/40"
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
                                <InputError message={pageErrors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_employee_code" value="社員コード（ログインID）" />
                                <TextInput
                                    id="edit_employee_code"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={editEmployeeCode}
                                    onChange={(e) => setEditEmployeeCode(e.target.value)}
                                    autoComplete="username"
                                />
                                <InputError message={pageErrors.employee_code} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_password" value="新しいパスワード（変更する場合のみ）" />
                                <TextInput
                                    id="edit_password"
                                    type="password"
                                    className="mt-1 block w-full"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <p className="mt-1 text-xs text-wa-muted">8文字以上。空のままなら変更しません。</p>
                                <InputError message={pageErrors.password} className="mt-2" />
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
                                <InputError message={pageErrors.role} className="mt-2" />
                            </div>
                            <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-wa-accent/20 bg-wa-ink/70 px-4 py-3 text-sm font-semibold text-wa-body">
                                <input
                                    type="checkbox"
                                    checked={editActive}
                                    onChange={(e) => {
                                        if (!e.target.checked) {
                                            setConfirmModal({
                                                message: 'このユーザーを無効化しますか？\n無効化するとログインできなくなります。',
                                                onConfirm: () => {
                                                    setEditActive(false);
                                                    setConfirmModal(null);
                                                },
                                            });
                                            return;
                                        }
                                        setEditActive(e.target.checked);
                                    }}
                                    className="h-4 w-4 rounded-sm border-wa-accent/35 text-wa-accent"
                                />
                                <span>
                                    <span className="block font-black tracking-tight">有効</span>
                                    <span className="mt-0.5 block text-xs font-normal text-wa-muted">
                                        チェックを外すとこのユーザーはログインできなくなります
                                    </span>
                                </span>
                            </label>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingUserId(null)}
                                    className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2.5 text-sm font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const payload: Record<string, string | boolean> = {
                                            name: editName,
                                            employee_code: editEmployeeCode,
                                            role: editRole,
                                            is_active: editActive,
                                        };
                                        if (editPassword.trim() !== '') {
                                            payload.password = editPassword;
                                        }
                                        router.patch(route('admin.users.update', { id: editingUser.id }), payload, {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setEditingUserId(null);
                                                setEditPassword('');
                                            },
                                        });
                                    }}
                                    className="rounded-sm border border-wa-accent/45 bg-wa-accent px-4 py-2.5 text-sm font-black tracking-tight text-wa-ink shadow-sm ring-1 ring-wa-accent/30 transition hover:bg-wa-accent/90"
                                >
                                    SAVE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {confirmModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[1px]">
                    <div className="w-full max-w-sm rounded-2xl border border-wa-accent/20 bg-wa-card p-6 shadow-xl shadow-black/50">
                        <div className="text-sm font-black tracking-tight text-wa-body whitespace-pre-line">
                            {confirmModal.message}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className="rounded-sm border border-wa-accent/25 bg-wa-ink px-4 py-2 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className="rounded-sm border border-red-500/45 bg-red-600 px-4 py-2 text-xs font-black tracking-tight text-white transition hover:bg-red-500"
                            >
                                無効化する
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
    );
}
