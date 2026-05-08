<?php

namespace App\Services;

use App\Models\DailyTaskEntry;
use App\Models\DailyTaskTemplate;
use App\Models\User;
use Illuminate\Support\Collection;

class DailyTaskService
{
    private function workDateString(User $actor): string
    {
        return now()->toDateString();
    }

    /**
     * @return Collection<int, DailyTaskTemplate>
     */
    public function templatesFor(User $actor): Collection
    {
        return DailyTaskTemplate::query()
            ->where('user_id', (int) $actor->id)
            ->orderBy('id')
            ->get();
    }

    /**
     * Today rows for UI: { id, title, status } (id = template id)
     *
     * @return array<int, array{id:int,title:string,status:string}>
     */
    public function todayTasksFor(User $actor): array
    {
        $date = $this->workDateString($actor);
        $templates = $this->templatesFor($actor);

        return $templates->map(function (DailyTaskTemplate $t) use ($actor, $date): array {
            $entry = DailyTaskEntry::query()
                ->where('user_id', (int) $actor->id)
                ->where('daily_task_template_id', (int) $t->id)
                ->whereDate('work_date', $date)
                ->first();

            return [
                'id' => (int) $t->id,
                'title' => (string) $t->title,
                'status' => (string) ($entry?->status ?? 'pending'),
            ];
        })->values()->all();
    }

    /**
     * @return array{id:int,title:string}
     */
    public function storeTemplate(User $actor, string $title): array
    {
        $t = DailyTaskTemplate::query()->create([
            'user_id' => (int) $actor->id,
            'title' => $title,
        ]);

        return [
            'id' => (int) $t->id,
            'title' => (string) $t->title,
        ];
    }

    public function destroyTemplate(User $actor, int $templateId): void
    {
        $t = DailyTaskTemplate::query()
            ->where('user_id', (int) $actor->id)
            ->where('id', $templateId)
            ->firstOrFail();
        $t->delete();
    }

    /**
     * @return array{id:int,title:string,status:string}
     */
    public function updateTodayStatus(User $actor, int $templateId, string $status): array
    {
        if (! in_array($status, ['pending', 'in_progress', 'completed'], true)) {
            abort(422, 'Invalid status');
        }

        $template = DailyTaskTemplate::query()
            ->where('user_id', (int) $actor->id)
            ->where('id', $templateId)
            ->firstOrFail();

        $date = $this->workDateString($actor);

        $entry = DailyTaskEntry::query()->updateOrCreate(
            [
                'user_id' => (int) $actor->id,
                'daily_task_template_id' => (int) $template->id,
                'work_date' => $date,
            ],
            ['status' => $status],
        );

        return [
            'id' => (int) $template->id,
            'title' => (string) $template->title,
            'status' => (string) $entry->status,
        ];
    }
}
