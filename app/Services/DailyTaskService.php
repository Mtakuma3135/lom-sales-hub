<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

class DailyTaskService
{
    private const TEMPLATE_KEY = 'daily_tasks.templates';
    private const STATUS_KEY_PREFIX = 'daily_tasks.status.';

    /**
     * @return Collection<int, array{id:int,title:string,status:string}>
     */
    public function index(User $actor): Collection
    {
        try {
            $templates = $this->templates($actor);
            $date = now()->toDateString();
            $statusKey = self::STATUS_KEY_PREFIX . $actor->id . '.' . $date;
            $statuses = Session::get($statusKey, []);

            return $templates->map(function (array $t) use ($statuses) {
                $status = $statuses[$t['id']] ?? 'pending';
                return [
                    'id' => $t['id'],
                    'title' => $t['title'],
                    'status' => $status,
                ];
            })->values();
        } catch (\Throwable $e) {
            Log::error('DailyTaskService.index failed', ['error' => $e->getMessage()]);
            return collect();
        }
    }

    /**
     * @return Collection<int, array{id:int,title:string}>
     */
    public function templates(User $actor): Collection
    {
        $key = self::TEMPLATE_KEY . '.' . $actor->id;
        $items = Session::get($key);

        if (is_array($items) && count($items) > 0) {
            return collect($items)->values();
        }

        $seed = collect([
            ['id' => 1, 'title' => '朝礼参加'],
            ['id' => 2, 'title' => 'メール・チャット確認'],
            ['id' => 3, 'title' => '日報作成'],
            ['id' => 4, 'title' => '架電リスト確認'],
            ['id' => 5, 'title' => '終礼参加'],
        ])->values();

        Session::put($key, $seed->all());

        return $seed;
    }

    public function updateStatus(User $actor, int $id, string $status): void
    {
        try {
            $date = now()->toDateString();
            $statusKey = self::STATUS_KEY_PREFIX . $actor->id . '.' . $date;
            $statuses = Session::get($statusKey, []);
            $statuses[$id] = $status;
            Session::put($statusKey, $statuses);
        } catch (\Throwable $e) {
            Log::error('DailyTaskService.updateStatus failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * @return array{id:int,title:string}
     */
    public function addTemplate(User $actor, string $title): array
    {
        $key = self::TEMPLATE_KEY . '.' . $actor->id;
        $templates = $this->templates($actor);
        $nextId = (int) max(1, (int) ($templates->max('id') ?? 0) + 1);

        $row = ['id' => $nextId, 'title' => $title];
        $templates = $templates->push($row)->values();
        Session::put($key, $templates->all());

        return $row;
    }

    public function removeTemplate(User $actor, int $id): void
    {
        $key = self::TEMPLATE_KEY . '.' . $actor->id;
        $templates = $this->templates($actor)
            ->filter(fn (array $t) => (int) $t['id'] !== $id)
            ->values();
        Session::put($key, $templates->all());
    }

    public function reorderTemplates(User $actor, array $ids): void
    {
        $key = self::TEMPLATE_KEY . '.' . $actor->id;
        $templates = $this->templates($actor);
        $indexed = $templates->keyBy('id');

        $reordered = collect($ids)
            ->map(fn (int $id) => $indexed->get($id))
            ->filter()
            ->values();

        Session::put($key, $reordered->all());
    }
}
