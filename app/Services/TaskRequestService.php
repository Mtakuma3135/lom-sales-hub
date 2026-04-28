<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class TaskRequestService
{
    private const SESSION_KEY = 'task_requests.items';

    /**
     * @return Collection<int, array{id:int,title:string,requester:string,priority:string,status:string,due_date:string,created_at:string}>
     */
    public function index(): Collection
    {
        try {
            $items = Session::get(self::SESSION_KEY);
            if (is_array($items)) {
                return collect($items)->values();
            }

            $seed = collect([
                [
                    'id' => 101,
                    'title' => 'トークスクリプトの更新依頼（本人確認）',
                    'requester' => '品質管理',
                    'priority' => 'high',
                    'status' => 'pending',
                    'due_date' => '2026-04-30',
                    'created_at' => '2026-04-22 11:10',
                    'to_user_id' => 1,
                    'from_user_id' => 2,
                ],
                [
                    'id' => 102,
                    'title' => '商材資料の差し替え（Driveリンク更新）',
                    'requester' => '商品企画',
                    'priority' => 'medium',
                    'status' => 'in_progress',
                    'due_date' => '2026-04-27',
                    'created_at' => '2026-04-21 16:40',
                    'to_user_id' => 2,
                    'from_user_id' => 1,
                ],
                [
                    'id' => 103,
                    'title' => 'KPI画面に「前月比」表示を追加',
                    'requester' => 'マネージャー',
                    'priority' => 'low',
                    'status' => 'completed',
                    'due_date' => '2026-04-25',
                    'created_at' => '2026-04-18 09:05',
                    'to_user_id' => 1,
                    'from_user_id' => 3,
                ],
                [
                    'id' => 104,
                    'title' => '周知事項のPIN運用ルール策定',
                    'requester' => '総務',
                    'priority' => 'medium',
                    'status' => 'pending',
                    'due_date' => '2026-04-24',
                    'created_at' => '2026-04-17 13:20',
                    'to_user_id' => 3,
                    'from_user_id' => 1,
                ],
            ])->values();

            Session::put(self::SESSION_KEY, $seed->all());

            return $seed;
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.index failed', ['error' => $e->getMessage()]);
            return collect();
        }
    }

    /**
     * 一般ユーザーは「自分に関係するもの」だけ（to/from が自分）。
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function indexFor(User $actor): Collection
    {
        $items = $this->index()->values();
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

    public function updateStatus(User $actor, int $id, string $status): Collection
    {
        try {
            $items = $this->index();

            $target = $items->first(fn (array $t) => (int) $t['id'] === (int) $id);
            if (! is_array($target)) {
                abort(404);
            }

            $updated = $items->map(function (array $t) use ($id, $status) {
                if ((int) $t['id'] !== (int) $id) {
                    return $t;
                }
                $t['status'] = $status;
                return $t;
            })->values();

            Session::put(self::SESSION_KEY, $updated->all());

            return $updated;
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

            $items = $this->index()->values();
            $nextId = (int) max(1, (int) ($items->max('id') ?? 0) + 1);

            $row = [
                'id' => $nextId,
                'title' => $title,
                'requester' => $actor->name ?? '—',
                'priority' => $priority,
                'status' => 'pending',
                'due_date' => now()->addDays(7)->format('Y-m-d'),
                'created_at' => now()->format('Y-m-d H:i:s'),
                'body' => $body,
                'to_user_id' => (int) $to->id,
                'from_user_id' => (int) $actor->id,
                'chat_sent' => false,
            ];

            $chatSent = $this->notifyGoogleChat($actor, $to, $title);
            $row['chat_sent'] = $chatSent;

            $updated = $items->prepend($row)->values();
            Session::put(self::SESSION_KEY, $updated->all());

            return $row;
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('TaskRequestService.store failed', [
                'to_user_id' => $toUserId,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    private function notifyGoogleChat(User $from, User $to, string $title): bool
    {
        try {
            $url = (string) config('services.google_chat.webhook_url', '');
            if ($url === '') {
                return false;
            }

            $text = "業務依頼が届きました。\n宛先: {$to->name}\n差出人: {$from->name}\n件名: {$title}";

            $res = Http::timeout(3)->post($url, [
                'text' => $text,
            ]);

            return $res->successful();
        } catch (\Throwable $e) {
            Log::warning('TaskRequestService.notifyGoogleChat failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
}

