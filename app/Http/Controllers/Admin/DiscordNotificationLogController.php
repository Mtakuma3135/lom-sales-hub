<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscordNotificationLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', DiscordNotificationLog::class);

        $q = DiscordNotificationLog::query()->orderByDesc('id');

        $eventType = trim((string) $request->query('event_type', ''));
        if ($eventType !== '') {
            $q->where('event_type', $eventType);
        }

        $triggeredBy = $request->query('triggered_by');
        if ($triggeredBy !== null && $triggeredBy !== '') {
            $q->where('triggered_by', (int) $triggeredBy);
        }

        $dateFrom = trim((string) $request->query('date_from', ''));
        if ($dateFrom !== '') {
            $q->whereDate('created_at', '>=', $dateFrom);
        }

        $dateTo = trim((string) $request->query('date_to', ''));
        if ($dateTo !== '') {
            $q->whereDate('created_at', '<=', $dateTo);
        }

        $status = trim((string) $request->query('status', ''));
        if ($status === 'success') {
            $q->whereBetween('status_code', [200, 299]);
        } elseif ($status === 'failed') {
            $q->where(function ($qq): void {
                $qq->whereNull('status_code')->orWhere('status_code', '>=', 300);
            });
        }

        $logs = $q->limit(100)->get([
            'id',
            'parent_id',
            'event_type',
            'status_code',
            'error_message',
            'triggered_by',
            'created_at',
        ]);

        return response()->json($logs);
    }

    public function retry(Request $request, int $id): JsonResponse
    {
        $this->authorize('create', DiscordNotificationLog::class);

        $base = DiscordNotificationLog::query()->findOrFail($id);

        $log = DiscordNotificationLog::query()->create([
            'parent_id' => (int) $base->id,
            'event_type' => (string) $base->event_type,
            'payload' => $base->payload,
            'triggered_by' => $request->user()?->id,
            'webhook_url' => $base->webhook_url,
        ]);

        SendDiscordNotification::dispatch((int) $log->id);

        return response()->json([
            'ok' => true,
            'log_id' => (int) $log->id,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $log = DiscordNotificationLog::query()->findOrFail($id);
        $this->authorize('view', $log);

        return response()->json($log);
    }
}
