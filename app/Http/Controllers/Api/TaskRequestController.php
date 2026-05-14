<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\TaskRequestIndexRequest;
use App\Http\Requests\Api\TaskRequestStoreRequest;
use App\Http\Requests\Api\TaskRequestUpdateRequest;
use App\Http\Resources\TaskRequestResource;
use App\Models\TaskRequest;
use App\Services\TaskRequestService;
use App\Support\TaskRequests\TaskRequestIndexFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
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
        $filtered = TaskRequestIndexFilter::apply(
            $items,
            $actor,
            $request->type(),
            $request->status(),
            $request->priority(),
            $request->sort(),
        );

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
            $request->dueDate(),
        );

        return response()->json(new TaskRequestResource($row), 201);
    }

    public function update(TaskRequestUpdateRequest $request, TaskRequestService $taskRequestService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $task = TaskRequest::query()->findOrFail($id);

        if ($request->isMetaUpdate()) {
            Gate::authorize('taskRequest.updateFields', $task);
            $row = $taskRequestService->updateMeta(
                $id,
                $request->metaTitle(),
                $request->metaBody(),
                $request->metaPriority(),
                $request->metaDueDate(),
            );
            if ($request->filled('status')) {
                Gate::authorize('taskRequest.updateStatus', $task);
                $taskRequestService->updateStatus($actor, $id, $request->status());
                $row = $taskRequestService->rowForId($id);
            }

            return response()->json(new TaskRequestResource($row));
        }

        Gate::authorize('taskRequest.updateStatus', $task);
        $taskRequestService->updateStatus($actor, $id, $request->status());

        return response()->json([
            'id' => $id,
            'status' => $request->status(),
        ]);
    }

    public function destroy(Request $request, TaskRequestService $taskRequestService, int $id): Response
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $task = TaskRequest::query()->findOrFail($id);
        Gate::authorize('taskRequest.delete', $task);
        $taskRequestService->softDelete($id);

        return response()->noContent();
    }

    public function restore(Request $request, TaskRequestService $taskRequestService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        if (! TaskRequest::softDeleteColumnExists()) {
            abort(
                503,
                'task_requests.deleted_at がありません。`php artisan migrate` または `php artisan db:ensure-task-requests-soft-deletes` を実行してください。',
            );
        }

        $task = TaskRequest::onlyTrashed()->findOrFail($id);
        Gate::authorize('taskRequest.restore', $task);
        $taskRequestService->restore($id);

        return response()->json(['id' => $id, 'restored' => true]);
    }
}
