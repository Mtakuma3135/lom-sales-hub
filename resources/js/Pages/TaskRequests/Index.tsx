import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type Task = {
    id: number;
    title: string;
    requester: string;
    priority: 'high' | 'medium' | 'low' | string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | string;
    due_date: string;
    created_at: string;
};

type TasksProp = {
    data: Task[];
};

type UserOption = { id: number; name: string; role: string };

const statusBadge = (status: Task['status']) => {
    switch (status) {
        case 'pending':
            return 'bg-amber-500/15 text-amber-200 ring-1 ring-inset ring-amber-400/25';
        case 'in_progress':
            return 'bg-cyan-500/15 text-cyan-200 ring-1 ring-inset ring-cyan-400/25';
        case 'completed':
            return 'bg-emerald-500/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/25';
        case 'rejected':
            return 'bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-400/25';
        default:
            return 'bg-white/5 text-white/70 ring-1 ring-inset ring-white/10';
    }
};

const priorityBadge = (p: Task['priority']) => {
    switch (p) {
        case 'high':
            return 'bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-400/25';
        case 'medium':
            return 'bg-purple-500/15 text-purple-200 ring-1 ring-inset ring-purple-400/25';
        case 'low':
            return 'bg-white/5 text-white/70 ring-1 ring-inset ring-white/10';
        default:
            return 'bg-white/5 text-white/70 ring-1 ring-inset ring-white/10';
    }
};

export default function Index({ tasks }: { tasks?: TasksProp }) {
    const { props } = usePage<{ userOptions?: UserOption[] }>();
    const userOptions = props.userOptions ?? [];

    const list =
        tasks?.data ??
        [
            {
                id: 101,
                title: 'トークスクリプトの更新依頼（本人確認）',
                requester: '品質管理',
                priority: 'high',
                status: 'pending',
                due_date: '2026-04-30',
                created_at: '2026-04-22 11:10',
            },
            {
                id: 102,
                title: '商材資料の差し替え（Driveリンク更新）',
                requester: '商品企画',
                priority: 'medium',
                status: 'in_progress',
                due_date: '2026-04-27',
                created_at: '2026-04-21 16:40',
            },
            {
                id: 103,
                title: 'KPI画面に「前月比」表示を追加',
                requester: 'マネージャー',
                priority: 'low',
                status: 'completed',
                due_date: '2026-04-25',
                created_at: '2026-04-18 09:05',
            },
            {
                id: 104,
                title: '周知事項のPIN運用ルール策定',
                requester: '総務',
                priority: 'medium',
                status: 'rejected',
                due_date: '2026-04-24',
                created_at: '2026-04-17 13:20',
            },
        ];

    // UI上の表示名: 未対応/対応中/完了（要求仕様）
    const statusLabel = (s: Task['status']) => {
        switch (s) {
            case 'pending':
                return '未対応';
            case 'in_progress':
                return '対応中';
            case 'completed':
                return '完了';
            default:
                return s;
        }
    };

    const [items, setItems] = useState<Task[]>(list);
    const [tab, setTab] = useState<'active' | 'done'>('active');

    const activeItems = useMemo(
        () => items.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
        [items],
    );
    const doneItems = useMemo(() => items.filter((t) => t.status === 'completed'), [items]);

    const onChangeStatus = (id: number, next: Task['status']) => {
        // 即時移動（仕様：変更された瞬間に完了リストへ）
        setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
        if (next === 'completed') setTab('done');

        router.patch(route('task-requests.update', id), { status: next }, { preserveScroll: true });
    };

    const [formTitle, setFormTitle] = useState<string>('');
    const [formToUserId, setFormToUserId] = useState<string>('');
    const [formPriority, setFormPriority] = useState<'urgent' | 'normal'>('normal');
    const [formBody, setFormBody] = useState<string>('');

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">TASK / REQUESTS</h2>}>
            <Head title="業務依頼" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* 左：作成フォーム風カード（UI操作可能） */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">NEW</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-white">依頼を作成</div>
                        <div className="mt-4 space-y-3">
                            <input
                                type="text"
                                placeholder="依頼タイトル"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                            />
                            <select
                                value={formToUserId}
                                onChange={(e) => setFormToUserId(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                            >
                                <option value="">宛先（ユーザー）を選択</option>
                                {userOptions.map((u) => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>
                            <select
                                value={formPriority}
                                onChange={(e) => setFormPriority(e.target.value as 'urgent' | 'normal')}
                                className="w-full rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                            >
                                <option value="urgent">優先度：高（urgent）</option>
                                <option value="normal">優先度：通常（normal）</option>
                            </select>
                            <textarea
                                rows={4}
                                placeholder="内容"
                                value={formBody}
                                onChange={(e) => setFormBody(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    router.post(
                                        route('task-requests.store'),
                                        {
                                            title: formTitle,
                                            to_user_id: formToUserId ? Number(formToUserId) : null,
                                            priority: formPriority,
                                            body: formBody,
                                        },
                                        {
                                            onSuccess: () => {
                                                setFormTitle('');
                                                setFormToUserId('');
                                                setFormPriority('normal');
                                                setFormBody('');
                                            },
                                            preserveScroll: true,
                                        },
                                    );
                                }}
                                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-3 py-3 text-sm font-black tracking-tight text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110"
                            >
                                依頼を作成
                            </button>
                        </div>
                    </div>

                    {/* 右：一覧テーブル */}
                    <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-white/60">LIST</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-white">依頼一覧</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTab('active')}
                                    className={
                                        'rounded-2xl px-4 py-2 text-xs font-black tracking-widest transition ' +
                                        (tab === 'active'
                                            ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)]'
                                            : 'bg-white/5 text-white/70 ring-1 ring-inset ring-white/10 hover:bg-white/10')
                                    }
                                >
                                    未対応/対応中
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTab('done')}
                                    className={
                                        'rounded-2xl px-4 py-2 text-xs font-black tracking-widest transition ' +
                                        (tab === 'done'
                                            ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)]'
                                            : 'bg-white/5 text-white/70 ring-1 ring-inset ring-white/10 hover:bg-white/10')
                                    }
                                >
                                    対応完了
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="検索"
                                className="w-44 rounded-2xl border border-white/10 bg-[#0b1020]/60 px-4 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                            />
                        </div>

                        <table className="mt-4 w-full border-collapse">
                            <thead>
                                <tr className="text-left text-xs text-white/60">
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">ID</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">TITLE</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">STATUS</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">PRIORITY</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">DUE</th>
                                    <th className="border-b border-white/10 px-3 py-2 font-bold tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(tab === 'done' ? doneItems : activeItems).map((t) => (
                                    <tr key={t.id} className="text-sm hover:bg-white/5 transition-colors">
                                        <td className="border-b border-white/10 px-3 py-3 text-white/70">
                                            #{t.id}
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3">
                                            <div className="font-black tracking-tight text-white">
                                                {t.title}
                                            </div>
                                            <div className="mt-1 text-xs text-white/45">
                                                依頼元: {t.requester} / 作成: {t.created_at}
                                            </div>
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3">
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    statusBadge(t.status)
                                                }
                                            >
                                                {statusLabel(t.status)}
                                            </span>
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3">
                                            <span
                                                className={
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black tracking-tight ' +
                                                    priorityBadge(t.priority)
                                                }
                                            >
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3 text-white/80">
                                            {t.due_date}
                                        </td>
                                        <td className="border-b border-white/10 px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={t.status}
                                                    onChange={(e) => onChangeStatus(t.id, e.target.value as Task['status'])}
                                                    className="rounded-2xl border border-white/10 bg-[#0b1020]/60 px-3 py-2 text-xs font-black tracking-tight text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:bg-white focus:text-black transition-colors"
                                                >
                                                    <option value="pending">未対応</option>
                                                    <option value="in_progress">対応中</option>
                                                    <option value="completed">完了</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    className="rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                                >
                                                    詳細
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-2xl bg-white/5 px-4 py-2 text-xs font-black tracking-tight text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10"
                                                >
                                                    更新
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
        </AuthenticatedLayout>
    );
}

