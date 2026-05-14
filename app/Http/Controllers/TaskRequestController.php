<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaskRequestStoreRequest;
use App\Http\Requests\TaskRequestUpdateRequest;
use App\Http\Resources\TaskRequestResource;
use App\Models\TaskRequest;
use App\Models\User;
use App\Services\DailyTaskService;
use App\Services\TaskRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class TaskRequestController extends Controller
{
    public function index(TaskRequestService $taskRequestService, DailyTaskService $dailyTaskService): Response
    {
        $actor = request()->user();
        if (! $actor) {
            abort(401);
        }

        $items = $taskRequestService->indexFor($actor);
        $itemsResource = TaskRequestResource::collection($items)
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        $trash = $taskRequestService->trashFor($actor);
        $trashResource = TaskRequestResource::collection($trash)
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        $templates = $dailyTaskService->templatesFor($actor)->map(fn ($t) => [
            'id' => (int) $t->id,
            'title' => (string) $t->title,
        ])->values()->all();

        return Inertia::render('TaskRequests/Index', [
            'tasks' => $itemsResource,
            'trashTasks' => $trashResource,
            'dailyTasks' => $dailyTaskService->todayTasksFor($actor),
            'dailyTemplates' => $templates,
            'userOptions' => User::query()
                ->select(['id', 'name', 'role'])
                ->when(($actor->role ?? 'general') !== 'admin', fn ($q) => $q->where('role', 'admin'))
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(TaskRequestStoreRequest $request, TaskRequestService $taskRequestService): RedirectResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $taskRequestService->store(
            $actor,
            $request->toUserId(),
            $request->title(),
            $request->priority(),
            $request->body(),
            $request->dueDate(),
        );

        return Redirect::route('task-requests.index');
    }

    public function update(TaskRequestUpdateRequest $request, TaskRequestService $taskRequestService, int $id): RedirectResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $task = TaskRequest::query()->findOrFail($id);

        if ($request->isMetaUpdate()) {
            Gate::authorize('taskRequest.updateFields', $task);
            $taskRequestService->updateMeta(
                $id,
                $request->metaTitle(),
                $request->metaBody(),
                $request->metaPriority(),
                $request->metaDueDate(),
            );
            if ($request->filled('status')) {
                Gate::authorize('taskRequest.updateStatus', $task);
                $taskRequestService->updateStatus($actor, $id, $request->status());
            }
        } else {
            Gate::authorize('taskRequest.updateStatus', $task);
            $taskRequestService->updateStatus($actor, $id, $request->status());
        }

        return Redirect::route('task-requests.index');
    }

    public function destroy(Request $request, TaskRequestService $taskRequestService, int $id): RedirectResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $task = TaskRequest::query()->findOrFail($id);
        Gate::authorize('taskRequest.delete', $task);
        $taskRequestService->softDelete($id);

        return Redirect::route('task-requests.index');
    }

    public function restore(Request $request, TaskRequestService $taskRequestService, int $id): RedirectResponse
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

        return Redirect::route('task-requests.index');
    }
}
