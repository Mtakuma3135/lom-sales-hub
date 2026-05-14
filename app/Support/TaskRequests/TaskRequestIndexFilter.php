<?php

namespace App\Support\TaskRequests;

use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Web の TaskRequestController と API の一覧を同一ルールでフィルタする（管理者は受信トレイ分割なし＝全件）。
 */
final class TaskRequestIndexFilter
{
    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return Collection<int, array<string, mixed>>
     */
    public static function apply(
        Collection $rows,
        User $actor,
        string $inboxType,
        ?string $status,
        ?string $priority,
        string $sort,
    ): Collection {
        $filtered = $rows->values();
        $isAdmin = ($actor->role ?? 'general') === 'admin';

        if (! $isAdmin) {
            $actorId = (int) $actor->id;
            if ($inboxType === 'sent') {
                $filtered = $filtered
                    ->filter(fn (array $t) => (int) ($t['from_user_id'] ?? -1) === $actorId)
                    ->values();
            } else {
                $filtered = $filtered
                    ->filter(fn (array $t) => (int) ($t['to_user_id'] ?? -1) === $actorId)
                    ->values();
            }
        }

        if ($status !== null && $status !== '') {
            $filtered = $filtered
                ->filter(fn (array $t) => (string) ($t['status'] ?? '') === $status)
                ->values();
        }

        if ($priority !== null && $priority !== '') {
            $filtered = $filtered
                ->filter(fn (array $t) => (string) ($t['priority'] ?? '') === $priority)
                ->values();
        }

        return $filtered
            ->sortBy(
                fn (array $t) => (string) ($t['created_at'] ?? ''),
                SORT_REGULAR,
                descending: $sort !== 'created_at_asc',
            )
            ->values();
    }
}
