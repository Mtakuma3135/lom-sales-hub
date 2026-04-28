<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SalesRecordIndexRequest;
use App\Models\SalesRecord;
use App\Services\SalesRecordService;
use Illuminate\Http\JsonResponse;

class SalesRecordController extends Controller
{
    public function index(SalesRecordIndexRequest $request, SalesRecordService $salesRecordService): JsonResponse
    {
        $this->authorize('viewAny', SalesRecord::class);

        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $params = $request->queryParams();
        $params['department_id'] = ($actor->role ?? 'general') !== 'admin' ? $actor->department_id : null;

        $payload = $salesRecordService->records($params, $actor);

        return response()->json($payload);
    }
}

