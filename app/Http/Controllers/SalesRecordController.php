<?php

namespace App\Http\Controllers;

use App\Models\SalesRecord;
use App\Services\SalesRecordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesRecordController extends Controller
{
    public function page(): Response
    {
        $this->authorize('viewAny', SalesRecord::class);

        return Inertia::render('Sales/Records');
    }

    public function index(Request $request, SalesRecordService $salesRecordService): JsonResponse
    {
        $this->authorize('viewAny', SalesRecord::class);

        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $payload = $salesRecordService->records([
            'page' => $request->integer('page', 1),
            'keyword' => $request->string('keyword')->toString(),
            'status' => $request->string('status')->toString(),
            'date_from' => $request->string('date_from')->toString(),
            'date_to' => $request->string('date_to')->toString(),
            'sort' => $request->string('sort')->toString(),
            'dir' => $request->string('dir')->toString(),
            // 一般ユーザーは部門スコープを強制（指示書準拠）
            'department_id' => ($actor->role ?? 'general') !== 'admin' ? $actor->department_id : null,
        ], $actor);

        return response()->json($payload);
    }
}

