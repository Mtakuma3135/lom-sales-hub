import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageProps } from '@/types';
import { showAppToast } from '@/lib/toast';
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
    to_user_id?: number | null;
    from_user_id?: number | null;
    body?: string;
};

type DailyTask = {
    id: number;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | string;
};

type DailyTemplate = {
    id: number;
    title: string;
};

type TasksProp = { data: Task[] };
type UserOption = { id: number; name: string; role: string };

const statusVariant = (status: string): 'primary' | 'success' | 'danger' | 'muted' | 'warning' => {
    switch (status) {
        case 'pending':
            return 'warning';
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

const priorityVariant = (p: string): 'primary' | 'success' | 'danger' | 'muted' => {
    switch (p) {
        case 'urgent': case 'high': return 'danger';
        case 'important': case 'medium': return 'primary';
        default: return 'muted';
    }
};

const priorityLabel = (p: string): string => {
    switch (p) {
        case 'urgent': case 'high': return '至急';
        case 'important': case 'medium': return '重要';
        case 'normal': case 'low': return '順次';
        default: return p;
    }
};

const statusLabel = (s: string): string => {
    switch (s) {
        case 'pending': return '未対応';
        case 'in_progress': return '対応中';
        case 'completed': return '完了';
        case 'rejected': return '却下';
        default: return s;
    }
};

const taskPrioRank = (p: string): number =>
    p === 'urgent' || p === 'high' ? 0 : p === 'important' || p === 'medium' ? 1 : 2;

function sortTasksForViewer(tasks: Task[], uid: number | null): Task[] {
    if (uid == null) return [...tasks];
    const n = Number(uid);
    return [...tasks].sort((a, b) => {
        const aMine = a.to_user_id != null && Number(a.to_user_id) === n;
        const bMine = b.to_user_id != null && Number(b.to_user_id) === n;
        if (aMine !== bMine) return aMine ? -1 : 1;
        const ap = taskPrioRank(a.priority);
        const bp = taskPrioRank(b.priority);
        if (ap !== bp) return ap - bp;
        return String(b.created_at).localeCompare(String(a.created_at));
    });
}

const sectionTab = (active: boolean) =>
    'rounded-xl px-5 py-2.5 text-xs font-black tracking-widest transition-all ' +
    (active
        ? 'border border-wa-accent/45 bg-wa-accent text-wa-ink'
        : 'border border-wa-accent/20 bg-wa-ink text-wa-muted hover:border-wa-accent/35 hover:text-wa-body');

const subTab = (active: boolean) =>
    'rounded-xl px-4 py-2 text-xs font-black tracking-widest transition-all ' +
    (active
        ? 'border border-wa-accent/35 bg-wa-subtle text-wa-body'
        : 'border border-wa-accent/15 bg-wa-ink text-wa-muted hover:border-wa-accent/25 hover:text-wa-body');

export default function Index({
    tasks,
    trashTasks,
    dailyTasks: dailyTasksProp,
    dailyTemplates: dailyTemplatesProp,
}: {
    tasks?: TasksProp;
    trashTasks?: TasksProp;
    dailyTasks?: DailyTask[];
    dailyTemplates?: DailyTemplate[];
}) {
    const { props } = usePage<
        PageProps & { userOptions?: UserOption[]; errors?: Record<string, string> }
    >();
    const userOptions = props.userOptions ?? [];
    const pageErrors = props.errors ?? {};
    const userId = props.auth?.user?.id ?? null;
    const isAdmin = (props.auth?.user?.role ?? 'general') === 'admin';

    // ── Section tab ──
    const [section, setSection] = useState<'requests' | 'daily'>('requests');

    // ══════════════════════════════════════════
    // ① 業務依頼
    // ══════════════════════════════════════════
    const list = tasks?.data ?? [];
    const [items, setItems] = useState<Task[]>(list);
    useEffect(() => {
        setItems(tasks?.data ?? []);
    }, [tasks]);

    const trashList = trashTasks?.data ?? [];
    const [trashItems, setTrashItems] = useState<Task[]>(trashList);
    useEffect(() => {
        setTrashItems(trashTasks?.data ?? []);
    }, [trashTasks]);
    const [reqTab, setReqTab] = useState<'active' | 'done' | 'trash'>('active');
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const selectedTask = useMemo(() => items.find((t) => t.id === selectedTaskId) ?? null, [items, selectedTaskId]);

    const canChangeStatus = useMemo(
        () =>
            isAdmin ||
            (userId != null &&
                selectedTask != null &&
                selectedTask.to_user_id != null &&
                Number(selectedTask.to_user_id) === Number(userId)),
        [isAdmin, userId, selectedTask],
    );

    const canDeleteTask = useMemo(() => {
        if (!selectedTask || userId == null) return false;
        if (isAdmin) return true;
        const uid = Number(userId);
        return (
            (selectedTask.to_user_id != null && Number(selectedTask.to_user_id) === uid) ||
            (selectedTask.from_user_id != null && Number(selectedTask.from_user_id) === uid)
        );
    }, [selectedTask, userId, isAdmin]);

    const canEditMeta = useMemo(
        () =>
            isAdmin ||
            (userId != null &&
                selectedTask != null &&
                selectedTask.to_user_id != null &&
                Number(selectedTask.to_user_id) === Number(userId)),
        [isAdmin, userId, selectedTask],
    );

    const canRestoreTask = useCallback(
        (t: Task) => {
            if (isAdmin) return true;
            if (userId == null) return false;
            const uid = Number(userId);
            return (
                (t.to_user_id != null && Number(t.to_user_id) === uid) ||
                (t.from_user_id != null && Number(t.from_user_id) === uid)
            );
        },
        [isAdmin, userId],
    );

    const activeItems = useMemo(
        () => items.filter((t) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'rejected'),
        [items],
    );
    const doneItems = useMemo(() => items.filter((t) => t.status === 'completed'), [items]);

    const activeItemsSorted = useMemo(() => sortTasksForViewer(activeItems, userId), [activeItems, userId]);
    const doneItemsSorted = useMemo(() => sortTasksForViewer(doneItems, userId), [doneItems, userId]);

    const assignedToMeCount = useMemo(
        () =>
            activeItems.filter(
                (t) => userId != null && t.to_user_id != null && Number(t.to_user_id) === Number(userId),
            ).length,
        [activeItems, userId],
    );

    const [formTitle, setFormTitle] = useState('');
    const [formToUserId, setFormToUserId] = useState('');
    const [formPriority, setFormPriority] = useState<'urgent' | 'important' | 'normal'>('normal');
    const [formBody, setFormBody] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [creating, setCreating] = useState(false);

    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');
    const [editPriority, setEditPriority] = useState<'urgent' | 'important' | 'normal'>('normal');
    const [editDueDate, setEditDueDate] = useState('');
    const [editStatus, setEditStatus] = useState<Task['status']>('pending');
    const [savingMeta, setSavingMeta] = useState(false);

    useEffect(() => {
        if (!selectedTask) return;
        setEditTitle(selectedTask.title);
        setEditBody(selectedTask.body ?? '');
        const p = selectedTask.priority;
        setEditPriority(p === 'urgent' || p === 'important' || p === 'normal' ? p : 'normal');
        setEditDueDate(selectedTask.due_date && selectedTask.due_date.length >= 10 ? selectedTask.due_date.slice(0, 10) : '');
        setEditStatus(
            (['pending', 'in_progress', 'completed', 'rejected'].includes(selectedTask.status)
                ? selectedTask.status
                : 'pending') as Task['status'],
        );
    }, [selectedTask]);

    // ══════════════════════════════════════════
    // ② 責タスク
    // ══════════════════════════════════════════
    const [dailyItems, setDailyItems] = useState<DailyTask[]>(dailyTasksProp ?? []);
    const [templates, setTemplates] = useState<DailyTemplate[]>(dailyTemplatesProp ?? []);
    const [tplDrawerOpen, setTplDrawerOpen] = useState(false);
    const [templateAdding, setTemplateAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const dailyCompleted = useMemo(() => dailyItems.filter((d) => d.status === 'completed').length, [dailyItems]);
    const dailyTotal = dailyItems.length;
    const dailyProgress = dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0;

    const onDailyStatusChange = async (id: number, status: string) => {
        setDailyItems((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
        await fetch(route('portal.api.daily-tasks.status', { id }), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            },
            credentials: 'same-origin',
            body: JSON.stringify({ status }),
        });
    };

    const onAddTemplate = async () => {
        if (!newTaskTitle.trim()) return;
        setTemplateAdding(true);
        try {
            const res = await fetch(route('portal.api.daily-tasks.templates.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ title: newTaskTitle.trim() }),
            });
            if (!res.ok) {
                showAppToast('追加に失敗しました');
                return;
            }
            const json = (await res.json()) as { data: DailyTemplate };
            setTemplates((prev) => [...prev, json.data]);
            setDailyItems((prev) => [...prev, { id: json.data.id, title: json.data.title, status: 'pending' }]);
            setNewTaskTitle('');
            showAppToast('タスクを追加しました');
        } finally {
            setTemplateAdding(false);
        }
    };

    const onRemoveTemplate = async (id: number) => {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setDailyItems((prev) => prev.filter((d) => d.id !== id));
        try {
            const res = await fetch(route('portal.api.daily-tasks.templates.destroy', { id }), {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                credentials: 'same-origin',
            });
            showAppToast(res.ok ? '削除しました' : '削除に失敗しました');
        } catch {
            showAppToast('削除に失敗しました');
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight text-wa-body">TASK / MANAGEMENT</h2>}>
            <Head title="タスク管理" />
            <div className="mx-auto max-w-6xl text-wa-body wa-body-track space-y-6">
                {/* Section Tabs */}
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setSection('requests')} className={sectionTab(section === 'requests')}>
                        業務依頼
                    </button>
                    <button type="button" onClick={() => setSection('daily')} className={sectionTab(section === 'daily')}>
                        責タスク
                    </button>
                </div>

                {section === 'requests' ? (
                    /* ═══ ① 業務依頼 ═══ */
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <NeonCard className="p-8">
                            <div className="text-xs font-bold tracking-widest text-wa-muted">NEW</div>
                            <div className="mt-2 text-sm font-black tracking-tight text-wa-body">依頼を作成</div>
                            <div className="mt-5 space-y-3">
                                <input type="text" placeholder="依頼タイトル" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="nordic-field" />
                                {pageErrors.title ? <p className="text-xs font-semibold text-red-400">{pageErrors.title}</p> : null}
                                <select value={formToUserId} onChange={(e) => setFormToUserId(e.target.value)} className="nordic-field">
                                    <option value="">宛先（ユーザー）を選択</option>
                                    {userOptions.map((u) => (
                                        <option key={u.id} value={String(u.id)}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                                {pageErrors.to_user_id ? <p className="text-xs font-semibold text-red-400">{pageErrors.to_user_id}</p> : null}
                                <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)} className="nordic-field">
                                    <option value="urgent">優先度：至急</option>
                                    <option value="important">優先度：重要</option>
                                    <option value="normal">優先度：順次</option>
                                </select>
                                {pageErrors.priority ? <p className="text-xs font-semibold text-red-400">{pageErrors.priority}</p> : null}
                                <textarea rows={4} placeholder="内容（任意）" value={formBody} onChange={(e) => setFormBody(e.target.value)} className="nordic-field min-h-[120px]" />
                                {pageErrors.body ? <p className="text-xs font-semibold text-red-400">{pageErrors.body}</p> : null}
                                <label className="block text-[11px] font-semibold text-wa-muted">期限（任意・未入力は7日後）</label>
                                <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="nordic-field" />
                                {pageErrors.due_date ? <p className="text-xs font-semibold text-red-400">{pageErrors.due_date}</p> : null}
                                <ActionButton
                                    className="w-full"
                                    disabled={creating}
                                    onClick={() => {
                                        router.post(route('task-requests.store'), {
                                            title: formTitle,
                                            to_user_id: formToUserId ? Number(formToUserId) : '',
                                            priority: formPriority,
                                            body: formBody,
                                            due_date: formDueDate || null,
                                        }, {
                                            onStart: () => setCreating(true),
                                            onFinish: () => setCreating(false),
                                            onSuccess: () => {
                                                setFormTitle('');
                                                setFormToUserId('');
                                                setFormPriority('normal');
                                                setFormBody('');
                                                setFormDueDate('');
                                                showAppToast('依頼を作成しました');
                                            },
                                            onError: () => showAppToast('入力内容を確認してください'),
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    {creating ? '送信中…' : '依頼を作成'}
                                </ActionButton>
                            </div>
                        </NeonCard>

                        <NeonCard className="lg:col-span-2 overflow-x-auto p-8" elevate={false}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-wa-muted">LIST</div>
                                    <div className="mt-1 text-sm font-black tracking-tight text-wa-body">依頼一覧</div>
                                    {assignedToMeCount > 0 ? (
                                        <p className="mt-2 text-sm text-wa-muted">
                                            あなた宛のタスク依頼が{' '}
                                            <span className="align-middle text-2xl font-black tabular-nums text-teal-300">
                                                {assignedToMeCount}
                                            </span>{' '}
                                            件あります
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => setReqTab('active')} className={subTab(reqTab === 'active')}>未対応/対応中</button>
                                    <button type="button" onClick={() => setReqTab('done')} className={subTab(reqTab === 'done')}>対応完了</button>
                                    <button type="button" onClick={() => setReqTab('trash')} className={subTab(reqTab === 'trash')}>ゴミ箱</button>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {reqTab === 'trash' ? (
                                    trashItems.length === 0 ? (
                                        <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                            ゴミ箱は空です
                                        </div>
                                    ) : (
                                        trashItems.map((t) => (
                                            <div
                                                key={t.id}
                                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-4"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-black tracking-tight text-wa-body">{t.title}</div>
                                                    <div className="mt-1 text-xs text-wa-muted">依頼元: {t.requester}</div>
                                                </div>
                                                {canRestoreTask(t) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            router.post(
                                                                route('task-requests.restore', t.id),
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess: () => showAppToast('復元しました'),
                                                                    onError: () => showAppToast('復元に失敗しました'),
                                                                },
                                                            );
                                                        }}
                                                        className="shrink-0 rounded-xl border border-teal-500/35 bg-wa-subtle px-4 py-2 text-xs font-black text-teal-200 transition hover:border-teal-400/50"
                                                    >
                                                        復元
                                                    </button>
                                                ) : null}
                                            </div>
                                        ))
                                    )
                                ) : (reqTab === 'done' ? doneItemsSorted : activeItemsSorted).length === 0 ? (
                                    <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                        {reqTab === 'done' ? '完了した依頼はありません' : '未対応の依頼はありません'}
                                    </div>
                                ) : (
                                    (reqTab === 'done' ? doneItemsSorted : activeItemsSorted).map((t) => {
                                        const mine =
                                            userId != null &&
                                            t.to_user_id != null &&
                                            Number(t.to_user_id) === Number(userId);
                                        return (
                                        <div
                                            key={t.id}
                                            onClick={() => setSelectedTaskId(t.id)}
                                            className={
                                                'cursor-pointer rounded-xl border px-4 py-4 transition hover:border-wa-accent/30 ' +
                                                (mine
                                                    ? 'border-teal-500/35 bg-teal-500/[0.07] ring-1 ring-teal-500/25'
                                                    : 'border-wa-accent/15 bg-wa-ink')
                                            }
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1 overflow-hidden">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {mine ? (
                                                            <StatusBadge variant="primary" pulse>あなた宛</StatusBadge>
                                                        ) : null}
                                                        <StatusBadge variant={priorityVariant(t.priority)}>{priorityLabel(t.priority)}</StatusBadge>
                                                        <StatusBadge variant={statusVariant(t.status)}>{statusLabel(t.status)}</StatusBadge>
                                                    </div>
                                                    <div className="wa-wrap-anywhere mt-2 text-sm font-black tracking-tight text-wa-body">{t.title}</div>
                                                    <div className="mt-1 text-xs text-wa-muted">依頼元: {t.requester} / 期限: {t.due_date}</div>
                                                    <div className="mt-2 text-[11px] text-wa-accent">タップして詳細・ステータス変更</div>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })
                                )}
                            </div>
                        </NeonCard>
                    </div>
                ) : (
                    /* ═══ ② 責タスク ═══ */
                    <div className="space-y-6">
                        {/* Progress overview */}
                        <NeonCard className="p-8" elevate={false}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-wa-muted">DAILY PROGRESS</div>
                                    <div className="mt-1 text-sm font-black tracking-tight text-wa-body">本日の進捗</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-wa-body">
                                        {dailyCompleted} / {dailyTotal}
                                    </span>
                                    <span className={`text-xs font-bold ${dailyProgress === 100 ? 'text-teal-300' : 'text-wa-muted'}`}>
                                        {dailyProgress}%
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-wa-ink">
                                <div
                                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${dailyProgress === 100 ? 'bg-teal-500' : 'bg-wa-accent'}`}
                                    style={{ width: `${dailyProgress}%` }}
                                />
                            </div>
                        </NeonCard>

                        {/* Task checklist */}
                        <NeonCard className="p-8" elevate={false}>
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-bold tracking-widest text-wa-muted">CHECKLIST</div>
                                        <div className="mt-1 text-sm font-black tracking-tight text-wa-body">今日のタスク</div>
                                    </div>
                                    {isAdmin ? (
                                    <button
                                        type="button"
                                        onClick={() => setTplDrawerOpen(true)}
                                        className="rounded-xl border border-wa-accent/25 bg-wa-subtle px-3 py-1.5 text-xs font-black tracking-tight text-wa-body transition hover:border-wa-accent/40"
                                    >
                                        テンプレートを管理
                                    </button>
                                    ) : null}
                                </div>

                                <div className="mt-5 space-y-2">
                                    {dailyItems.length === 0 ? (
                                        <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                            {isAdmin
                                                ? 'タスクが登録されていません。「テンプレートを管理」から追加してください。'
                                                : 'タスクが登録されていません。管理者にテンプレート登録を依頼してください。'}
                                        </div>
                                    ) : (
                                        dailyItems.map((d) => (
                                            <div
                                                key={d.id}
                                                className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                                                    d.status === 'completed'
                                                        ? 'border-teal-500/20 bg-wa-ink'
                                                        : d.status === 'in_progress'
                                                          ? 'border-wa-accent/30 bg-wa-ink'
                                                          : 'border-wa-accent/15 bg-wa-ink'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = d.status === 'completed' ? 'pending' : 'completed';
                                                        void onDailyStatusChange(d.id, next);
                                                    }}
                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                                                        d.status === 'completed'
                                                            ? 'border-teal-500/50 bg-teal-500/20 text-teal-300'
                                                            : 'border-wa-accent/30 bg-wa-ink text-transparent hover:border-wa-accent/50'
                                                    }`}
                                                >
                                                    {d.status === 'completed' ? '✓' : ''}
                                                </button>

                                                <div className={`min-w-0 flex-1 text-sm font-semibold ${d.status === 'completed' ? 'text-wa-muted line-through' : 'text-wa-body'}`}>
                                                    {d.title}
                                                </div>

                                                {d.status !== 'completed' && (
                                                    <select
                                                        value={d.status}
                                                        onChange={(e) => void onDailyStatusChange(d.id, e.target.value)}
                                                        className="nordic-field max-w-[110px] shrink-0 py-1 text-[11px] font-black"
                                                    >
                                                        <option value="pending">未対応</option>
                                                        <option value="in_progress">対応中</option>
                                                        <option value="completed">完了</option>
                                                    </select>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </NeonCard>
                    </div>
                )}
            </div>

            {/* Detail Drawer for 業務依頼 */}
            <DetailDrawer
                open={selectedTaskId !== null}
                title={selectedTask?.title ?? '業務依頼'}
                onClose={() => setSelectedTaskId(null)}
            >
                {selectedTask ? (
                    <div className="space-y-4">
                        {canEditMeta ? (
                            <div className="rounded-xl border border-wa-accent/20 bg-wa-ink px-4 py-4">
                                <div className="text-[11px] font-bold tracking-widest text-wa-muted">依頼の編集</div>
                                <div className="mt-3 space-y-3">
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="nordic-field"
                                        placeholder="タイトル"
                                    />
                                    <textarea
                                        rows={6}
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        className="nordic-field min-h-[120px]"
                                        placeholder="内容"
                                    />
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <select
                                            value={editPriority}
                                            onChange={(e) =>
                                                setEditPriority(e.target.value as 'urgent' | 'important' | 'normal')
                                            }
                                            className="nordic-field py-2 text-xs font-black"
                                        >
                                            <option value="urgent">至急</option>
                                            <option value="important">重要</option>
                                            <option value="normal">順次</option>
                                        </select>
                                        <input
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                            className="nordic-field py-2 text-xs"
                                        />
                                        {canChangeStatus ? (
                                            <select
                                                value={editStatus}
                                                onChange={(e) => setEditStatus(e.target.value as Task['status'])}
                                                className="nordic-field py-2 text-xs font-black tracking-tight lg:col-span-2"
                                            >
                                                <option value="pending">未対応</option>
                                                <option value="in_progress">対応中</option>
                                                <option value="completed">完了</option>
                                                <option value="rejected">却下</option>
                                            </select>
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-xl border border-wa-accent/15 bg-wa-card px-3 py-2 lg:col-span-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-wa-muted">
                                                    状態
                                                </span>
                                                <StatusBadge variant={statusVariant(selectedTask.status)}>
                                                    {statusLabel(selectedTask.status)}
                                                </StatusBadge>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        disabled={savingMeta}
                                        onClick={() => {
                                            setSavingMeta(true);
                                            const payload: Record<string, string | null> = {
                                                title: editTitle,
                                                body: editBody,
                                                priority: editPriority,
                                                due_date: editDueDate || null,
                                            };
                                            if (canChangeStatus) {
                                                payload.status = editStatus;
                                            }
                                            router.patch(route('task-requests.update', selectedTask.id), payload, {
                                                preserveScroll: true,
                                                onFinish: () => setSavingMeta(false),
                                                onSuccess: () => {
                                                    showAppToast('保存しました');
                                                    if (editStatus === 'completed') setReqTab('done');
                                                },
                                                onError: () => showAppToast('保存に失敗しました'),
                                            });
                                        }}
                                        className="w-full rounded-xl border border-wa-accent/40 bg-wa-accent px-4 py-3 text-xs font-black text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-40"
                                    >
                                        {savingMeta ? '保存中…' : '保存'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-wa-muted">TITLE</div>
                                    <div className="mt-1 text-base font-black tracking-tight text-wa-body">{selectedTask.title}</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <StatusBadge variant={statusVariant(selectedTask.status)}>
                                            {statusLabel(selectedTask.status)}
                                        </StatusBadge>
                                        <StatusBadge variant={priorityVariant(selectedTask.priority)}>
                                            {priorityLabel(selectedTask.priority)}
                                        </StatusBadge>
                                    </div>
                                    <div className="mt-2 text-xs text-wa-muted">
                                        依頼元: {selectedTask.requester} / 作成: {selectedTask.created_at} / 期限:{' '}
                                        {selectedTask.due_date}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3">
                                    <div className="text-[11px] font-bold tracking-widest text-wa-muted">本文</div>
                                    <div className="wa-wrap-anywhere mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-wa-body">
                                        {selectedTask.body?.trim() ? selectedTask.body : '（本文なし）'}
                                    </div>
                                </div>
                            </div>
                        )}
                        {canDeleteTask ? (
                            <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-4">
                                <div className="text-[11px] font-bold uppercase tracking-widest text-red-200">ゴミ箱へ移動</div>
                                <p className="mt-2 text-xs text-red-200/90">
                                    一覧から非表示になります。依頼の関係者はゴミ箱から復元できます。
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!window.confirm('この依頼をゴミ箱に移動しますか？')) return;
                                        router.delete(route('task-requests.destroy', selectedTask.id), {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setSelectedTaskId(null);
                                                showAppToast('ゴミ箱に移動しました');
                                            },
                                            onError: () => showAppToast('削除に失敗しました'),
                                        });
                                    }}
                                    className="mt-3 w-full rounded-xl border border-red-500/45 bg-wa-ink px-4 py-3 text-xs font-black tracking-widest text-red-200 transition hover:border-red-400 hover:bg-red-950/40"
                                >
                                    ゴミ箱へ移動
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="rounded-xl border border-wa-accent/15 bg-wa-card px-4 py-6 text-sm text-wa-muted">データがありません</div>
                )}
            </DetailDrawer>

            <DetailDrawer open={tplDrawerOpen} title="責タスクのテンプレート" onClose={() => setTplDrawerOpen(false)}>
                <div className="space-y-5">
                    <p className="text-xs text-wa-muted">
                        追加した項目は毎日のチェックリストに反映されます（進捗は日次でリセットされます）。
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="新しいタスク名"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void onAddTemplate();
                                }
                            }}
                            className="nordic-field min-w-0 flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => void onAddTemplate()}
                            disabled={!newTaskTitle.trim() || templateAdding}
                            className="shrink-0 rounded-xl border border-wa-accent/40 bg-wa-accent px-4 py-3 text-xs font-black text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-40"
                        >
                            {templateAdding ? '追加中…' : '追加'}
                        </button>
                    </div>
                    <div className="border-t border-wa-accent/15 pt-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-wa-muted">登録済み ({templates.length})</div>
                        <div className="mt-3 max-h-[min(360px,50vh)] space-y-2 overflow-y-auto pr-1">
                            {templates.length === 0 ? (
                                <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-3 py-6 text-center text-sm text-wa-muted">
                                    まだありません
                                </div>
                            ) : (
                                templates.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-wa-accent/15 bg-wa-ink px-3 py-2">
                                        <span className="min-w-0 flex-1 truncate text-sm text-wa-body">{t.title}</span>
                                        <button
                                            type="button"
                                            onClick={() => void onRemoveTemplate(t.id)}
                                            className="shrink-0 rounded-lg border border-red-500/25 px-2 py-1 text-[10px] font-bold text-red-400 transition hover:border-red-500/45"
                                        >
                                            削除
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DetailDrawer>
        </AuthenticatedLayout>
    );
}
