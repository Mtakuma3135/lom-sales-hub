<?php

namespace App\Http\Controllers;

use App\Services\DailyTaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class DailyTaskApiController extends Controller
{
    public function updateStatus(Request $request, DailyTaskService $dailyTaskService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:pending,in_progress,completed'],
        ]);

        $row = $dailyTaskService->updateTodayStatus($actor, $id, $validated['status']);

        return response()->json(['data' => $row]);
    }

    public function storeTemplate(Request $request, DailyTaskService $dailyTaskService): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:500'],
        ]);

        $row = $dailyTaskService->storeTemplate($actor, $validated['title']);

        return response()->json(['data' => $row], 201);
    }

    public function destroyTemplate(Request $request, DailyTaskService $dailyTaskService, int $id): Response
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $dailyTaskService->destroyTemplate($actor, $id);

        return response()->noContent();
    }
}
