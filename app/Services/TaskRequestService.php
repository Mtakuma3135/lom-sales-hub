<?php

namespace App\Services;

use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use App\Models\TaskRequest;
use App\Models\User;
use App\Notifications\Discord\DiscordPayloadFactory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

class TaskRequestService
{
    /**
     * @return Collection<int, array{id:int,title:string,requester:string,priority:string,status:string,due_date:string,created_at:string}>
     */
    public function index(): Collection
    {
        try {
            $items = TaskRequest::query()
                ->orderByDesc('id')
                ->get();

            return $items->map(fn (TaskRequest $t) => $this->toRow($t))->values();
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.index failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /**
     * 一覧（本人が関係するもの＋管理者は全体）。完了も含む。
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function indexFor(User $actor): Collection
    {
        $items = $this->index()->values();

        if (($actor->role ?? 'general') === 'admin') {
            return $items->values();
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
     * ホームのタスクウィジェット用（未完了のみ）
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function indexActiveForHome(User $actor): Collection
    {
        return $this->indexFor($actor)
            ->filter(function (array $t): bool {
                $s = (string) ($t['status'] ?? '');

                return $s === 'pending' || $s === 'in_progress';
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
     * @return array{id:int,title:string,requester:string,priority:string,status:string,due_date:string,created_at:string,body:string,to_user_id:int,from_user_id:int,chat_sent:bool}
     */
    public function store(User $actor, int $toUserId, string $title, string $priority, string $body): array
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

            $t = TaskRequest::query()->create([
                'title' => $title,
                'requester' => (string) ($actor->name ?? '—'),
                'priority' => $priority,
                'status' => 'pending',
                'due_date' => now()->addDays(7)->toDateString(),
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
            if ((string) config('services.discord.webhook_url', '') === '') {
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
            'due_date' => $t->due_date ? (string) $t->due_date : '',
            'created_at' => $t->created_at?->format('Y-m-d H:i:s') ?? '',
            'body' => (string) ($t->body ?? ''),
            'to_user_id' => (int) ($t->to_user_id ?? 0),
            'from_user_id' => (int) ($t->from_user_id ?? 0),
            'chat_sent' => (bool) ($t->chat_sent ?? false),
        ];
    }
}
