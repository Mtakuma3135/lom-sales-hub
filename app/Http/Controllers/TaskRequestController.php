<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaskRequestUpdateRequest;
use App\Http\Requests\TaskRequestStoreRequest;
use App\Http\Resources\TaskRequestResource;
use App\Services\TaskRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskRequestController extends Controller
{
    public function index(TaskRequestService $taskRequestService): Response
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

        return Inertia::render('TaskRequests/Index', [
            'tasks' => $itemsResource,
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
}

