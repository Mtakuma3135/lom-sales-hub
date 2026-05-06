<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LunchBreakAssignRequest;
use App\Http\Requests\LunchBreakGridSyncRequest;
use App\Http\Requests\LunchBreakCompleteRequest;
use App\Http\Requests\LunchBreakStartRequest;
use App\Http\Requests\LunchBreakLaneTimerRequest;
use App\Http\Requests\LunchBreakStoreRequest;
use App\Http\Resources\LunchBreakSlotResource;
use App\Services\LunchBreakService;
use App\Models\LunchBreak;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class LunchBreakController extends Controller
{
    public function index(Request $request, LunchBreakService $lunchBreakService): Response
    {
        $this->authorize('viewAny', LunchBreak::class);

        $date = (string) ($request->query('date') ?? now()->toDateString());

        $slots = $lunchBreakService->index($date);

        $slotsResource = LunchBreakSlotResource::collection($slots)
            ->additional(['meta' => ['date' => $date]])
            ->response()
            ->getData(true);

        // 管理者割り当て制に変更：ユーザー自身の予約IDは不要
        $users = collect();
        if (($request->user()?->role ?? 'general') === 'admin') {
            $users = \App\Models\User::query()
                ->orderBy('id')
                ->get(['id', 'name', 'employee_code', 'role'])
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'employee_code' => $u->employee_code,
                    'role' => $u->role,
                ])
                ->values();
        }

        $myAssignment = null;
        $actorId = $request->user()?->id;
        if ($actorId !== null) {
            foreach ($slots as $slot) {
                foreach ($slot['reservations'] as $reservation) {
                    if ((int) $reservation->user_id === (int) $actorId) {
                        $myAssignment = [
                            'start_time' => $slot['start_time'],
                            'end_time' => $slot['end_time'],
                        ];
                        break 2;
                    }
                }
            }
        }

        $timetable = $lunchBreakService->timetableGrid($date);

        return Inertia::render('LunchBreaks/Index', [
            'date' => $date,
            'slots' => $slotsResource,
            'timetable' => $timetable,
            'users' => [
                'data' => $users,
                'meta' => [],
            ],
            'myAssignment' => $myAssignment,
            'serverNow' => now()->toISOString(),
        ]);
    }

    public function store(LunchBreakStoreRequest $request, LunchBreakService $lunchBreakService): RedirectResponse
    {
        $this->authorize('create', LunchBreak::class);

        $actor = $request->user();
        if ($actor === null) {
            return Redirect::route('login');
        }

        $lunchBreakService->store($actor, $request->lunchDate(), $request->lunchStartTime());

        return Redirect::route('lunch-breaks.index', ['date' => $request->lunchDate()]);
    }

    public function destroy(Request $request, LunchBreakService $lunchBreakService, int $id): RedirectResponse
    {
        $actor = $request->user();
        if ($actor === null) {
            return Redirect::route('login');
        }

        $reservation = LunchBreak::query()->findOrFail($id);
        $this->authorize('delete', $reservation);

        $lunchBreakService->destroy($actor, $id);

        return Redirect::route('lunch-breaks.index', ['date' => (string) ($request->query('date') ?? now()->toDateString())]);
    }

    public function assign(LunchBreakAssignRequest $request, LunchBreakService $lunchBreakService): RedirectResponse
    {
        $this->authorize('assign', LunchBreak::class);

        $actor = $request->user();
        if ($actor === null) {
            return Redirect::route('login');
        }

        $lunchBreakService->assign(
            actor: $actor,
            date: $request->lunchDate(),
            startTime: $request->lunchStartTime(),
            userIds: $request->userIds(),
        );

        return Redirect::route('lunch-breaks.index', ['date' => $request->lunchDate()]);
    }

    public function gridSync(LunchBreakGridSyncRequest $request, LunchBreakService $lunchBreakService): RedirectResponse
    {
        $this->authorize('assign', LunchBreak::class);

        $actor = $request->user();
        if ($actor === null) {
            return Redirect::route('login');
        }

        $lunchBreakService->syncTimetable($actor, $request->lunchDate(), $request->cells());

        return Redirect::route('lunch-breaks.index', ['date' => $request->lunchDate()]);
    }

    public function complete(LunchBreakCompleteRequest $request, LunchBreakService $lunchBreakService)
    {
        $actor = $request->user();
        if ($actor === null) {
            return response()->json(['data' => ['success' => false], 'meta' => []], 401);
        }

        $success = $lunchBreakService->complete($actor, $request->lunchDate());

        return response()->json(['data' => ['success' => $success], 'meta' => []], $success ? 200 : 500);
    }

    public function status(Request $request, LunchBreakService $lunchBreakService)
    {
        $this->authorize('viewAny', LunchBreak::class);

        $date = (string) ($request->query('date') ?? now()->toDateString());

        $slots = $lunchBreakService->index($date);
        $slotsResource = LunchBreakSlotResource::collection($slots)
            ->additional(['meta' => ['date' => $date]])
            ->response()
            ->getData(true);

        $active = $lunchBreakService->activeStatus($date);

        return response()->json([
            'data' => [
                'slots' => $slotsResource,
                'active' => $active,
            ],
            'meta' => [
                'date' => $date,
                'server_time' => now()->toISOString(),
            ],
        ]);
    }

    public function start(LunchBreakStartRequest $request, LunchBreakService $lunchBreakService)
    {
        $this->authorize('viewAny', LunchBreak::class);

        $actor = $request->user();
        if ($actor === null) {
            return response()->json(['data' => ['success' => false], 'meta' => []], 401);
        }

        $row = $lunchBreakService->startLaneTimer($actor, $request->lunchDate(), $request->lane());

        return response()->json([
            'data' => [
                'success' => true,
                'active' => $row,
            ],
            'meta' => [
                'date' => $request->lunchDate(),
            ],
        ]);
    }

    public function stop(LunchBreakLaneTimerRequest $request, LunchBreakService $lunchBreakService)
    {
        $this->authorize('viewAny', LunchBreak::class);

        $actor = $request->user();
        if ($actor === null) {
            return response()->json(['data' => ['success' => false], 'meta' => []], 401);
        }

        $success = $lunchBreakService->stopLaneTimer($actor, $request->lunchDate(), $request->lane());

        return response()->json(['data' => ['success' => $success], 'meta' => ['date' => $request->lunchDate()]], $success ? 200 : 500);
    }

    public function reset(LunchBreakLaneTimerRequest $request, LunchBreakService $lunchBreakService)
    {
        $this->authorize('viewAny', LunchBreak::class);

        $actor = $request->user();
        if ($actor === null) {
            return response()->json(['data' => ['success' => false], 'meta' => []], 401);
        }

        $success = $lunchBreakService->resetLaneTimer($actor, $request->lunchDate(), $request->lane());

        return response()->json(['data' => ['success' => $success], 'meta' => ['date' => $request->lunchDate()]], $success ? 200 : 500);
    }
}

