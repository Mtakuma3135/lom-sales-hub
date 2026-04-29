<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\TaskRequestIndexRequest;
use App\Http\Requests\Api\TaskRequestStoreRequest;
use App\Http\Requests\Api\TaskRequestUpdateRequest;
use App\Http\Resources\TaskRequestResource;
use App\Services\TaskRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;

class TaskRequestController extends Controller
{
    public function index(TaskRequestIndexRequest $request, TaskRequestService $taskRequestService): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $items = $taskRequestService->indexFor($actor);
        $filtered = $this->filter($items, (int) $actor->id, $request->type(), $request->status(), $request->priority(), $request->sort());

        return response()->json([
            'data' => TaskRequestResource::collection($filtered)->resolve(),
            'current_page' => 1,
            'last_page' => 1,
        ]);
    }

    public function store(TaskRequestStoreRequest $request, TaskRequestService $taskRequestService): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $row = $taskRequestService->store(
            $actor,
            $request->toUserId(),
            $request->title(),
            $request->priority(),
            $request->body(),
        );

        return response()->json(new TaskRequestResource($row), 201);
    }

    public function update(TaskRequestUpdateRequest $request, TaskRequestService $taskRequestService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $task = $taskRequestService->index()->first(fn (array $t) => (int) ($t['id'] ?? -1) === (int) $id);
        if (! is_array($task)) {
            abort(404);
        }
        // IMPORTANT: associative array would be treated as named arguments in PHP8
        Gate::authorize('taskRequest.update', [$task]);

        $taskRequestService->updateStatus($actor, $id, $request->status());

        return response()->json([
            'id' => $id,
            'status' => $request->status(),
        ]);
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $items
     * @return Collection<int, array<string, mixed>>
     */
    private function filter(Collection $items, int $actorId, string $type, ?string $status, ?string $priority, string $sort): Collection
    {
        $filtered = $items->values();

        if ($type === 'sent') {
            $filtered = $filtered->filter(fn (array $t) => (int) ($t['from_user_id'] ?? -1) === $actorId)->values();
        } else {
            $filtered = $filtered->filter(fn (array $t) => (int) ($t['to_user_id'] ?? -1) === $actorId)->values();
        }

        if ($status !== null) {
            $filtered = $filtered->filter(fn (array $t) => (string) ($t['status'] ?? '') === $status)->values();
        }

        if ($priority !== null) {
            $filtered = $filtered->filter(fn (array $t) => (string) ($t['priority'] ?? '') === $priority)->values();
        }

        $filtered = $filtered->sortBy(function (array $t) {
            return (string) ($t['created_at'] ?? '');
        }, options: SORT_REGULAR, descending: $sort !== 'created_at_asc')->values();

        return $filtered;
    }
}

