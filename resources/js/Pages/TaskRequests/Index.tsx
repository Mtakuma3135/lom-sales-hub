import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import NeonCard from '@/Components/NeonCard';
import ActionButton from '@/Components/ActionButton';
import StatusBadge from '@/Components/StatusBadge';
import DetailDrawer from '@/Components/DetailDrawer';
import { apiFetch } from '@/lib/fetch';
import { showAppToast } from '@/lib/toast';

type Task = {
    id: number;
    title: string;
    requester: string;
    priority: 'urgent' | 'important' | 'normal' | string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | string;
    due_date: string;
    created_at: string;
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

const statusVariant = (status: string): 'primary' | 'success' | 'danger' | 'muted' => {
    switch (status) {
        case 'pending': case 'in_progress': return 'primary';
        case 'completed': return 'success';
        case 'rejected': return 'danger';
        default: return 'muted';
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
    dailyTasks: dailyTasksProp,
    dailyTemplates: dailyTemplatesProp,
}: {
    tasks?: TasksProp;
    dailyTasks?: DailyTask[];
    dailyTemplates?: DailyTemplate[];
}) {
    const { props } = usePage<{ userOptions?: UserOption[] }>();
    const userOptions = props.userOptions ?? [];

    // ── Section tab ──
    const [section, setSection] = useState<'requests' | 'daily'>('requests');

    // ══════════════════════════════════════════
    // ① 業務依頼
    // ══════════════════════════════════════════
    const list = tasks?.data ?? [];
    const [items, setItems] = useState<Task[]>(list);
    const [reqTab, setReqTab] = useState<'active' | 'done'>('active');
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const selectedTask = useMemo(() => items.find((t) => t.id === selectedTaskId) ?? null, [items, selectedTaskId]);

    const activeItems = useMemo(() => items.filter((t) => t.status === 'pending' || t.status === 'in_progress'), [items]);
    const doneItems = useMemo(() => items.filter((t) => t.status === 'completed'), [items]);

    const onChangeStatus = (id: number, next: Task['status']) => {
        setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
        if (next === 'completed') setReqTab('done');
        router.patch(route('task-requests.update', id), { status: next }, { preserveScroll: true });
    };

    const [formTitle, setFormTitle] = useState('');
    const [formToUserId, setFormToUserId] = useState('');
    const [formPriority, setFormPriority] = useState<'urgent' | 'important' | 'normal'>('normal');
    const [formBody, setFormBody] = useState('');

    // ══════════════════════════════════════════
    // ② 責タスク
    // ══════════════════════════════════════════
    const [dailyItems, setDailyItems] = useState<DailyTask[]>(dailyTasksProp ?? []);
    const [templates, setTemplates] = useState<DailyTemplate[]>(dailyTemplatesProp ?? []);
    const [editMode, setEditMode] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const dailyCompleted = useMemo(() => dailyItems.filter((d) => d.status === 'completed').length, [dailyItems]);
    const dailyTotal = dailyItems.length;
    const dailyProgress = dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0;

    const onDailyStatusChange = async (id: number, status: string) => {
        const prev = dailyItems.find((d) => d.id === id)?.status;
        setDailyItems((items) => items.map((d) => (d.id === id ? { ...d, status } : d)));
        try {
            const res = await apiFetch(route('portal.api.daily-tasks.status', { id }), {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
        } catch {
            setDailyItems((items) => items.map((d) => (d.id === id ? { ...d, status: prev ?? 'pending' } : d)));
            showAppToast('ステータスの更新に失敗しました');
        }
    };

    const onAddTemplate = async () => {
        if (!newTaskTitle.trim()) return;
        try {
            const res = await apiFetch(route('portal.api.daily-tasks.templates.store'), {
                method: 'POST',
                body: JSON.stringify({ title: newTaskTitle.trim() }),
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const json = (await res.json()) as { data: DailyTemplate };
            setTemplates((prev) => [...prev, json.data]);
            setDailyItems((prev) => [...prev, { id: json.data.id, title: json.data.title, status: 'pending' }]);
            setNewTaskTitle('');
            showAppToast('タスクを追加しました');
        } catch {
            showAppToast('タスクの追加に失敗しました');
        }
    };

    const onRemoveTemplate = async (id: number) => {
        const prevTemplates = templates;
        const prevDaily = dailyItems;
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setDailyItems((prev) => prev.filter((d) => d.id !== id));
        try {
            const res = await apiFetch(route('portal.api.daily-tasks.templates.destroy', { id }), {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
        } catch {
            setTemplates(prevTemplates);
            setDailyItems(prevDaily);
            showAppToast('タスクの削除に失敗しました');
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
                                <select value={formToUserId} onChange={(e) => setFormToUserId(e.target.value)} className="nordic-field">
                                    <option value="">宛先（ユーザー）を選択</option>
                                    {userOptions.map((u) => (
                                        <option key={u.id} value={String(u.id)}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                                <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)} className="nordic-field">
                                    <option value="urgent">優先度：至急</option>
                                    <option value="important">優先度：重要</option>
                                    <option value="normal">優先度：順次</option>
                                </select>
                                <textarea rows={4} placeholder="内容" value={formBody} onChange={(e) => setFormBody(e.target.value)} className="nordic-field min-h-[120px]" />
                                <ActionButton
                                    className="w-full"
                                    onClick={() => {
                                        router.post(route('task-requests.store'), {
                                            title: formTitle, to_user_id: formToUserId ? Number(formToUserId) : null,
                                            priority: formPriority, body: formBody,
                                        }, {
                                            onSuccess: () => { setFormTitle(''); setFormToUserId(''); setFormPriority('normal'); setFormBody(''); },
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    依頼を作成
                                </ActionButton>
                            </div>
                        </NeonCard>

                        <NeonCard className="lg:col-span-2 overflow-x-auto p-8" elevate={false}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-wa-muted">LIST</div>
                                    <div className="mt-1 text-sm font-black tracking-tight text-wa-body">依頼一覧</div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => setReqTab('active')} className={subTab(reqTab === 'active')}>未対応/対応中</button>
                                    <button type="button" onClick={() => setReqTab('done')} className={subTab(reqTab === 'done')}>対応完了</button>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {(reqTab === 'done' ? doneItems : activeItems).length === 0 ? (
                                    <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                        {reqTab === 'done' ? '完了した依頼はありません' : '未対応の依頼はありません'}
                                    </div>
                                ) : (
                                    (reqTab === 'done' ? doneItems : activeItems).map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => setSelectedTaskId(t.id)}
                                            className="cursor-pointer rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-4 transition hover:border-wa-accent/30"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge variant={priorityVariant(t.priority)}>{priorityLabel(t.priority)}</StatusBadge>
                                                        <StatusBadge variant={statusVariant(t.status)}>{statusLabel(t.status)}</StatusBadge>
                                                    </div>
                                                    <div className="mt-2 text-sm font-black tracking-tight text-wa-body">{t.title}</div>
                                                    <div className="mt-1 text-xs text-wa-muted">依頼元: {t.requester} / 期限: {t.due_date}</div>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-2">
                                                    <span className="text-[10px] text-wa-muted">#{t.id}</span>
                                                    <select
                                                        value={t.status}
                                                        onChange={(e) => onChangeStatus(t.id, e.target.value as Task['status'])}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="nordic-field max-w-[120px] py-1.5 text-[11px] font-black tracking-tight"
                                                    >
                                                        <option value="pending">未対応</option>
                                                        <option value="in_progress">対応中</option>
                                                        <option value="completed">完了</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))
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

                        {/* Task checklist + Edit panel */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <NeonCard className="lg:col-span-2 p-8" elevate={false}>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-bold tracking-widest text-wa-muted">CHECKLIST</div>
                                        <div className="mt-1 text-sm font-black tracking-tight text-wa-body">今日のタスク</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(!editMode)}
                                        className={`rounded-xl border px-3 py-1.5 text-xs font-black tracking-tight transition ${
                                            editMode
                                                ? 'border-wa-accent/45 bg-wa-accent text-wa-ink'
                                                : 'border-wa-accent/25 bg-wa-subtle text-wa-body hover:border-wa-accent/40'
                                        }`}
                                    >
                                        {editMode ? '完了' : '編集'}
                                    </button>
                                </div>

                                <div className="mt-5 space-y-2">
                                    {dailyItems.length === 0 ? (
                                        <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-6 text-center text-sm text-wa-muted">
                                            タスクが登録されていません。「編集」から追加してください。
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
                                                        onDailyStatusChange(d.id, next);
                                                    }}
                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                                                        d.status === 'completed'
                                                            ? 'border-teal-500/50 bg-teal-500/20 text-teal-300'
                                                            : 'border-wa-accent/30 bg-wa-ink text-transparent hover:border-wa-accent/50'
                                                    }`}
                                                >
                                                    {d.status === 'completed' ? '✓' : ''}
                                                </button>

                                                <div className={`flex-1 text-sm font-semibold ${d.status === 'completed' ? 'text-wa-muted line-through' : 'text-wa-body'}`}>
                                                    {d.title}
                                                </div>

                                                {!editMode && d.status !== 'completed' && (
                                                    <select
                                                        value={d.status}
                                                        onChange={(e) => onDailyStatusChange(d.id, e.target.value)}
                                                        className="nordic-field max-w-[110px] py-1 text-[11px] font-black"
                                                    >
                                                        <option value="pending">未対応</option>
                                                        <option value="in_progress">対応中</option>
                                                        <option value="completed">完了</option>
                                                    </select>
                                                )}

                                                {editMode && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemoveTemplate(d.id)}
                                                        className="rounded-lg border border-red-500/25 bg-wa-ink px-2 py-1 text-[11px] font-bold text-red-400 transition hover:border-red-500/40"
                                                    >
                                                        削除
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </NeonCard>

                            <NeonCard className="p-8">
                                <div className="text-xs font-bold tracking-widest text-wa-muted">EDIT</div>
                                <div className="mt-2 text-sm font-black tracking-tight text-wa-body">タスク項目の管理</div>
                                <div className="mt-2 text-xs text-wa-muted">
                                    ここで追加したタスクは毎日リセットされます
                                </div>

                                <div className="mt-5 space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="新しいタスク名"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddTemplate(); } }}
                                            className="nordic-field flex-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={onAddTemplate}
                                            disabled={!newTaskTitle.trim()}
                                            className="shrink-0 rounded-xl border border-wa-accent/40 bg-wa-accent px-4 py-3 text-xs font-black text-wa-ink transition hover:bg-wa-accent/90 disabled:opacity-40"
                                        >
                                            追加
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 border-t border-wa-accent/15 pt-4">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-wa-muted">登録済み ({templates.length})</div>
                                    <div className="mt-3 space-y-2">
                                        {templates.map((t) => (
                                            <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-wa-accent/15 bg-wa-ink px-3 py-2">
                                                <span className="text-sm text-wa-body">{t.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveTemplate(t.id)}
                                                    className="text-[10px] font-bold text-wa-muted transition hover:text-red-400"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </NeonCard>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Drawer for 業務依頼 */}
            <DetailDrawer open={selectedTaskId !== null} title={`TASK #${selectedTaskId ?? ''}`} onClose={() => setSelectedTaskId(null)}>
                {selectedTask ? (
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">TITLE</div>
                            <div className="mt-1 text-base font-black tracking-tight text-wa-body">{selectedTask.title}</div>
                            <div className="mt-2 text-xs text-wa-muted">
                                依頼元: {selectedTask.requester} / 作成: {selectedTask.created_at} / 期限: {selectedTask.due_date}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3">
                                <div className="text-[11px] font-bold tracking-widest text-wa-muted">STATUS</div>
                                <div className="mt-2"><StatusBadge variant={statusVariant(selectedTask.status)}>{statusLabel(selectedTask.status)}</StatusBadge></div>
                            </div>
                            <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3">
                                <div className="text-[11px] font-bold tracking-widest text-wa-muted">PRIORITY</div>
                                <div className="mt-2"><StatusBadge variant={priorityVariant(selectedTask.priority)}>{priorityLabel(selectedTask.priority)}</StatusBadge></div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-wa-accent/15 bg-wa-ink px-4 py-3">
                            <div className="text-[11px] font-bold tracking-widest text-wa-muted">UPDATE STATUS</div>
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
                                <ActionButton onClick={() => setSelectedTaskId(null)}>閉じる</ActionButton>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-wa-accent/15 bg-wa-card px-4 py-6 text-sm text-wa-muted">データがありません</div>
                )}
            </DetailDrawer>
        </AuthenticatedLayout>
    );
}
