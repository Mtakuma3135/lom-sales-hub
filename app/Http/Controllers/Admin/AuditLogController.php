<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', AuditLog::class);

        $sort = trim((string) $request->query('sort', 'created_at'));
        $dirRaw = strtolower(trim((string) $request->query('dir', 'desc')));
        $dir = $dirRaw === 'asc' ? 'asc' : 'desc';

        $allowed = [
            'created_at' => 'created_at',
            'status_code' => 'status_code',
            'integration' => 'integration',
            'event_type' => 'event_type',
            'related_id' => 'related_id',
            'status' => 'status',
            'mode' => 'mode',
        ];
        $col = $allowed[$sort] ?? 'created_at';

        $logs = AuditLog::query()
            ->with('user')
            ->orderBy($col, $dir)
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString()
            ->through(function (AuditLog $log): array {
                $row = $log->toArray();
                $row['meta'] = is_array($log->meta) ? $log->meta : [];
                $metaMode = isset($row['meta']['mode']) && is_string($row['meta']['mode'])
                    ? (string) $row['meta']['mode']
                    : null;
                if (! array_key_exists('mode', $row) || $row['mode'] === null || $row['mode'] === '') {
                    $row['mode'] = $metaMode;
                }

                return $row;
            });

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $logs,
        ]);
    }

    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        $log = AuditLog::query()->with('user')->findOrFail($id);
        $this->authorize('view', $log);

        return response()->json($log);
    }
}

