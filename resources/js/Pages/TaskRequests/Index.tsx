import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import NeonCard from '@/Components/NeonCard';
import ActionButton from '@/Components/ActionButton';
import StatusBadge from '@/Components/StatusBadge';
import DetailDrawer from '@/Components/DetailDrawer';

type Task = {
    id: number;
    title: string;
    requester: string;
    priority: 'urgent' | 'important' | 'normal' | string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | string;
    due_date: string;
    created_at: string;
};

type TasksProp = {
    data: Task[];
};

type UserOption = { id: number; name: string; role: string };

const statusVariant = (status: Task['status']): 'primary' | 'success' | 'danger' | 'muted' => {
    switch (status) {
        case 'pending':
            return 'primary';
        case 'in_progress':
            return 'primary';
        case 'completed':
            return 'success';
        case 'rejected':
            return 'danger';
        default:
            return 'muted';
    }
};

const priorityVariant = (p: Task['priority']): 'primary' | 'success' | 'danger' | 'muted' => {
    switch (p) {
        case 'urgent':
            return 'danger';
        case 'important':
            return 'primary';
        case 'normal':
            return 'muted';
        default:
            // 互換（旧データ）
            if (p === 'high') return 'danger';
            if (p === 'medium') return 'primary';
            return 'muted';
    }
};

const priorityLabel = (p: Task['priority']): string => {
    switch (p) {
        case 'urgent':
            return '至急';
        case 'important':
            return '重要';
        case 'normal':
            return '順次';
        default:
            // 互換（旧データ）
            if (p === 'high') return '至急';
            if (p === 'medium') return '重要';
            if (p === 'low') return '順次';
            return p;
    }
};

const tabBtn = (active: boolean) =>
    'rounded-xl px-4 py-2 text-xs font-black tracking-widest transition-all duration-200 hover:scale-[1.02] ' +
    (active
        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/15 ring-1 ring-emerald-500/30'
        : 'bg-white/80 text-stone-600 ring-1 ring-stone-200 hover:bg-emerald-50/60');

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
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const selectedTask = useMemo(
        () => items.find((t) => t.id === selectedTaskId) ?? null,
        [items, selectedTaskId],
    );

    const activeItems = useMemo(
        () => items.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
        [items],
    );
    const doneItems = useMemo(() => items.filter((t) => t.status === 'completed'), [items]);

    const onChangeStatus = (id: number, next: Task['status']) => {
        setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
        if (next === 'completed') setTab('done');

        router.patch(route('task-requests.update', id), { status: next }, { preserveScroll: true });
    };

    const [formTitle, setFormTitle] = useState<string>('');
    const [formToUserId, setFormToUserId] = useState<string>('');
    const [formPriority, setFormPriority] = useState<'urgent' | 'important' | 'normal'>('normal');
    const [formBody, setFormBody] = useState<string>('');

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">TASK / REQUESTS</h2>}>
            <Head title="業務依頼" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-stone-800">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard>
                        <div className="text-xs font-bold tracking-widest text-stone-500">NEW</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-stone-900">依頼を作成</div>
                        <div className="mt-4 space-y-3">
                            <input
                                type="text"
                                placeholder="依頼タイトル"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="nordic-field"
                            />
                            <select
                                value={formToUserId}
                                onChange={(e) => setFormToUserId(e.target.value)}
                                className="nordic-field"
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
                                onChange={(e) => setFormPriority(e.target.value as 'urgent' | 'important' | 'normal')}
                                className="nordic-field"
                            >
                                <option value="urgent">優先度：至急</option>
                                <option value="important">優先度：重要</option>
                                <option value="normal">優先度：順次</option>
                            </select>
                            <textarea
                                rows={4}
                                placeholder="内容"
                                value={formBody}
                                onChange={(e) => setFormBody(e.target.value)}
                                className="nordic-field min-h-[120px]"
                            />
                            <ActionButton
                                className="w-full"
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
                            >
                                依頼を作成
                            </ActionButton>
                        </div>
                    </NeonCard>

                    <NeonCard className="lg:col-span-2 overflow-x-auto" elevate={false}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold tracking-widest text-stone-500">LIST</div>
                                <div className="mt-1 text-lg font-black tracking-tight text-stone-900">依頼一覧</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button type="button" onClick={() => setTab('active')} className={tabBtn(tab === 'active')}>
                                    未対応/対応中
                                </button>
                                <button type="button" onClick={() => setTab('done')} className={tabBtn(tab === 'done')}>
                                    対応完了
                                </button>
                            </div>
                            <input type="text" placeholder="検索" className="nordic-field w-44" />
                        </div>

                        <table className="mt-4 w-full border-collapse">
                            <thead>
                                <tr className="text-left text-xs text-stone-500">
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">ID</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">TITLE</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">STATUS</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">PRIORITY</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">DUE</th>
                                    <th className="border-b border-stone-200 px-3 py-2 font-bold tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(tab === 'done' ? doneItems : activeItems).map((t) => (
                                    <tr
                                        key={t.id}
                                        className="cursor-pointer text-sm transition-colors hover:bg-white/70"
                                        onClick={() => setSelectedTaskId(t.id)}
                                    >
                                        <td className="border-b border-stone-200 px-3 py-3 text-stone-500">#{t.id}</td>
                                        <td className="border-b border-stone-200 px-3 py-3">
                                            <div className="font-black tracking-tight text-stone-900">{t.title}</div>
                                            <div className="mt-1 text-xs text-stone-500">
                                                依頼元: {t.requester} / 作成: {t.created_at}
                                            </div>
                                        </td>
                                        <td className="border-b border-stone-200 px-3 py-3">
                                            <StatusBadge variant={statusVariant(t.status)}>{statusLabel(t.status)}</StatusBadge>
                                        </td>
                                        <td className="border-b border-stone-200 px-3 py-3">
                                            <StatusBadge variant={priorityVariant(t.priority)}>{priorityLabel(t.priority)}</StatusBadge>
                                        </td>
                                        <td className="border-b border-stone-200 px-3 py-3 text-stone-700">{t.due_date}</td>
                                        <td className="border-b border-stone-200 px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={t.status}
                                                    onChange={(e) => onChangeStatus(t.id, e.target.value as Task['status'])}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="nordic-field max-w-[140px] py-2 text-xs font-black tracking-tight"
                                                >
                                                    <option value="pending">未対応</option>
                                                    <option value="in_progress">対応中</option>
                                                    <option value="completed">完了</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </NeonCard>
                </div>
            </div>

            <DetailDrawer
                open={selectedTaskId !== null}
                title={`TASK #${selectedTaskId ?? ''}`}
                onClose={() => setSelectedTaskId(null)}
            >
                {selectedTask ? (
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-stone-500">TITLE</div>
                            <div className="mt-1 text-base font-black tracking-tight text-stone-900">{selectedTask.title}</div>
                            <div className="mt-2 text-xs text-stone-500">
                                依頼元: {selectedTask.requester} / 作成: {selectedTask.created_at} / 期限:{' '}
                                {selectedTask.due_date}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                                <div className="text-[11px] font-bold tracking-widest text-stone-500">STATUS</div>
                                <div className="mt-2">
                                    <StatusBadge variant={statusVariant(selectedTask.status)}>
                                        {statusLabel(selectedTask.status)}
                                    </StatusBadge>
                                </div>
                            </div>
                            <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                                <div className="text-[11px] font-bold tracking-widest text-stone-500">PRIORITY</div>
                                <div className="mt-2">
                                    <StatusBadge variant={priorityVariant(selectedTask.priority)}>
                                        {priorityLabel(selectedTask.priority)}
                                    </StatusBadge>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-stone-200 bg-white/70 px-4 py-3">
                            <div className="text-[11px] font-bold tracking-widest text-stone-500">UPDATE STATUS</div>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <select
                                    value={selectedTask.status}
                                    onChange={(e) => onChangeStatus(selectedTask.id, e.target.value as Task['status'])}
                                    className="nordic-field max-w-[180px] py-2 text-xs font-black tracking-tight"
                                >
                                    <option value="pending">未対応</option>
                                    <option value="in_progress">対応中</option>
                                    <option value="completed">完了</option>
                                </select>
                                <ActionButton
                                    onClick={() => {
                                        setSelectedTaskId(null);
                                    }}
                                >
                                    閉じる
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                        データがありません
                    </div>
                )}
            </DetailDrawer>
        </AuthenticatedLayout>
    );
}
