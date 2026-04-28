<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $q = AuditLog::query()->orderByDesc('id');

        $integration = trim((string) $request->query('integration', ''));
        if ($integration !== '') {
            $q->where('integration', $integration);
        }

        $eventType = trim((string) $request->query('event_type', ''));
        if ($eventType !== '') {
            $q->where('event_type', $eventType);
        }

        $status = trim((string) $request->query('status', ''));
        if ($status !== '') {
            $q->where('status', $status);
        }

        $actorId = $request->query('actor_id');
        if ($actorId !== null && $actorId !== '') {
            $q->where('actor_id', (int) $actorId);
        }

        $dateFrom = trim((string) $request->query('date_from', ''));
        if ($dateFrom !== '') {
            $q->whereDate('created_at', '>=', $dateFrom);
        }

        $dateTo = trim((string) $request->query('date_to', ''));
        if ($dateTo !== '') {
            $q->whereDate('created_at', '<=', $dateTo);
        }

        $logs = $q->limit(200)->get([
            'id',
            'integration',
            'event_type',
            'status',
            'status_code',
            'error_message',
            'actor_id',
            'related_type',
            'related_id',
            'created_at',
        ]);

        return response()->json($logs);
    }

    public function show(int $id): JsonResponse
    {
        $log = AuditLog::query()->findOrFail($id);
        $this->authorize('view', $log);

        return response()->json($log);
    }
}

