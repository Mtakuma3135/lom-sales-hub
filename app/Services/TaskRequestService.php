<?php

namespace App\Services;

use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use App\Models\TaskRequest;
use App\Models\User;
use App\Notifications\Discord\DiscordPayloadFactory;
use App\Support\DiscordWebhookResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

class TaskRequestService
{
    /**
     * 一覧（本人が関係するもの＋管理者は全体）。完了も含む。Web / API 共通のクエリ基盤。
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function indexFor(User $actor): Collection
    {
        try {
            return $this->visibleQueryFor($actor)
                ->get()
                ->map(fn (TaskRequest $t) => $this->toRow($t))
                ->values();
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.indexFor failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /**
     * 業務依頼の可視スコープ（管理者は全件、一般は from / to のみ）。
     */
    public function visibleQueryFor(User $actor): Builder
    {
        $q = TaskRequest::query()->orderByDesc('id');

        if (($actor->role ?? 'general') !== 'admin') {
            $id = (int) $actor->id;
            $q->where(function (Builder $w) use ($id): void {
                $w->where('to_user_id', $id)->orWhere('from_user_id', $id);
            });
        }

        return $q;
    }

    /**
     * ホームのタスクウィジェット用（未完了のみ）
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function indexActiveForHome(User $actor): Collection
    {
        $actorId = (int) $actor->id;

        return $this->indexFor($actor)
            ->filter(function (array $t): bool {
                $s = (string) ($t['status'] ?? '');

                return $s === 'pending' || $s === 'in_progress';
            })
            ->sort(function (array $a, array $b) use ($actorId): int {
                $aMine = (int) ($a['to_user_id'] ?? 0) === $actorId;
                $bMine = (int) ($b['to_user_id'] ?? 0) === $actorId;
                if ($aMine !== $bMine) {
                    return $aMine ? -1 : 1;
                }
                $prio = ['urgent' => 0, 'high' => 0, 'important' => 1, 'medium' => 1, 'normal' => 2, 'low' => 2];
                $ap = $prio[(string) ($a['priority'] ?? 'normal')] ?? 9;
                $bp = $prio[(string) ($b['priority'] ?? 'normal')] ?? 9;
                if ($ap !== $bp) {
                    return $ap - $bp;
                }

                return strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? ''));
            })
            ->values();
    }

    public function updateStatus(User $actor, int $id, string $status): Collection
    {
        try {
            $t = TaskRequest::query()->findOrFail($id);
            $t->status = $status;
            $t->save();

            return $this->indexFor($actor);
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.updateStatus failed', [
                'id' => $id,
                'status' => $status,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rowForId(int $id): array
    {
        $t = TaskRequest::query()->findOrFail($id);

        return $this->toRow($t);
    }

    /**
     * 管理者のみ（ゲートは呼び出し側）
     */
    public function updateMeta(
        int $id,
        string $title,
        string $body,
        string $priority,
        ?string $dueDate,
    ): array {
        try {
            $t = TaskRequest::query()->findOrFail($id);
            $t->title = $title;
            $t->body = $body;
            $t->priority = $priority;
            if ($dueDate !== null && $dueDate !== '') {
                $t->due_date = $dueDate;
            }
            $t->save();

            return $this->toRow($t->fresh());
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.updateMeta failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    public function softDelete(int $id): void
    {
        try {
            $t = TaskRequest::query()->findOrFail($id);
            $t->delete();
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.softDelete failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    public function restore(int $id): void
    {
        if (! TaskRequest::softDeleteColumnExists()) {
            abort(
                503,
                'task_requests.deleted_at がありません。`php artisan migrate` または `php artisan db:ensure-task-requests-soft-deletes` を実行してください。',
            );
        }

        try {
            $t = TaskRequest::onlyTrashed()->findOrFail($id);
            $t->restore();
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.restore failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    /**
     * ゴミ箱（論理削除済み）一覧。管理者は全体、一般は関係するもののみ。
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function trashFor(User $actor): Collection
    {
        if (! TaskRequest::softDeleteColumnExists()) {
            return collect();
        }

        $items = TaskRequest::onlyTrashed()
            ->orderByDesc('id')
            ->get()
            ->map(fn (TaskRequest $t) => $this->toRow($t))
            ->values();

        if (($actor->role ?? 'general') === 'admin') {
            return $items;
        }

        $actorId = (int) $actor->id;

        return $items
            ->filter(function (array $t) use ($actorId): bool {
                return (int) ($t['to_user_id'] ?? -1) === $actorId
                    || (int) ($t['from_user_id'] ?? -1) === $actorId;
            })
            ->values();
    }

    /**
     * @return array{id:int,title:string,requester:string,priority:string,status:string,due_date:string,created_at:string,body:string,to_user_id:int,from_user_id:int,chat_sent:bool}
     */
    public function store(User $actor, int $toUserId, string $title, string $priority, string $body, ?string $dueDate = null): array
    {
        try {
            if ((int) $toUserId === (int) $actor->id) {
                abort(422, '宛先に自分自身は指定できません。');
            }

            $to = User::query()->findOrFail($toUserId);
            if (($actor->role ?? 'general') !== 'admin' && ($to->role ?? 'general') !== 'admin') {
                abort(403);
            }

            $notifyOk = $this->notifyDiscordTaskRequest($actor, $to, $title);

            $due = $dueDate !== null && $dueDate !== ''
                ? $dueDate
                : now()->addDays(7)->toDateString();

            $t = TaskRequest::query()->create([
                'title' => $title,
                'requester' => (string) ($actor->name ?? '—'),
                'priority' => $priority,
                'status' => 'pending',
                'due_date' => $due,
                'body' => $body,
                'to_user_id' => (int) $to->id,
                'from_user_id' => (int) $actor->id,
                'chat_sent' => $notifyOk,
            ]);

            return $this->toRow($t);
        } catch (HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.store failed', [
                'to_user_id' => $toUserId,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    /**
     * 業務依頼作成時の Discord 通知（ログ作成＋ジョブ送信。Webhook 未設定時は false）
     */
    private function notifyDiscordTaskRequest(User $from, User $to, string $title): bool
    {
        try {
            $target = DiscordWebhookResolver::forTaskRequestRecipient($to);
            if ($target === '') {
                return false;
            }

            $payload = DiscordPayloadFactory::taskRequestCreated(
                (string) ($from->name ?? '—'),
                (string) ($to->name ?? '—'),
                $title
            );

            $log = DiscordNotificationLog::query()->create([
                'event_type' => 'task_request.created',
                'payload' => $payload,
                'triggered_by' => (int) $from->id,
                'webhook_url' => $target,
            ]);

            SendDiscordNotification::dispatch((int) $log->id);

            return true;
        } catch (\Throwable $e) {
            Log::warning('TaskRequestService.notifyDiscordTaskRequest failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * @return array{id:int,title:string,requester:string,priority:string,status:string,due_date:string,created_at:string,body:string,to_user_id:int,from_user_id:int,chat_sent:bool}
     */
    private function toRow(TaskRequest $t): array
    {
        return [
            'id' => (int) $t->id,
            'title' => (string) $t->title,
            'requester' => (string) ($t->requester ?? ''),
            'priority' => (string) ($t->priority ?? 'normal'),
            'status' => (string) ($t->status ?? 'pending'),
            'due_date' => $t->due_date ? $t->due_date->toDateString() : '',
            'created_at' => $t->created_at?->format('Y-m-d H:i:s') ?? '',
            'body' => (string) ($t->body ?? ''),
            'to_user_id' => (int) ($t->to_user_id ?? 0),
            'from_user_id' => (int) ($t->from_user_id ?? 0),
            'chat_sent' => (bool) ($t->chat_sent ?? false),
        ];
    }
}
