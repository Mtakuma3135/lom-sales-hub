<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaskRequestUpdateRequest;
use App\Http\Requests\TaskRequestStoreRequest;
use App\Http\Resources\TaskRequestResource;
use App\Services\DailyTaskService;
use App\Services\TaskRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
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

        $dailyTasks = $dailyTaskService->index($actor);
        $dailyTemplates = $dailyTaskService->templates($actor);

        return Inertia::render('TaskRequests/Index', [
            'tasks' => $itemsResource,
            'dailyTasks' => $dailyTasks,
            'dailyTemplates' => $dailyTemplates,
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

        $taskRequestService->store($actor, $request->toUserId(), $request->title(), $request->priority(), $request->body());

        return Redirect::route('task-requests.index');
    }

    public function update(TaskRequestUpdateRequest $request, TaskRequestService $taskRequestService, int $id): RedirectResponse
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

        return Redirect::route('task-requests.index');
    }

    public function dailyUpdateStatus(Request $request, DailyTaskService $dailyTaskService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $status = $request->validate(['status' => 'required|string|in:pending,in_progress,completed'])['status'];
        $dailyTaskService->updateStatus($actor, $id, $status);

        return response()->json(['ok' => true]);
    }

    public function dailyAddTemplate(Request $request, DailyTaskService $dailyTaskService): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $title = $request->validate(['title' => 'required|string|max:255'])['title'];
        $row = $dailyTaskService->addTemplate($actor, $title);

        return response()->json(['data' => $row]);
    }

    public function dailyRemoveTemplate(Request $request, DailyTaskService $dailyTaskService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $dailyTaskService->removeTemplate($actor, $id);

        return response()->json(['ok' => true]);
    }
}

