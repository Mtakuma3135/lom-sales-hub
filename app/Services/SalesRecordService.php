<?php

namespace App\Services;

use App\Models\SalesRecord;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SalesRecordService
{
    /**
     * @param  array{page?:int,keyword?:string,status?:string,date_from?:string,date_to?:string,sort?:string,dir?:string}  $query
     * @return array{data:array<int,array{id:int,staff_name:string,status:string,date:string}>,current_page:int,last_page:int,total:int}
     */
    public function records(array $query, User $actor): array
    {
        try {
            $page = max(1, (int) ($query['page'] ?? 1));
            $keyword = trim((string) ($query['keyword'] ?? ''));
            $status = trim((string) ($query['status'] ?? ''));
            $dateFrom = trim((string) ($query['date_from'] ?? ''));
            $dateTo = trim((string) ($query['date_to'] ?? ''));
            $departmentId = $query['department_id'] ?? null;
            $sort = trim((string) ($query['sort'] ?? ''));
            $dirRaw = strtolower(trim((string) ($query['dir'] ?? 'desc')));
            $dir = $dirRaw === 'asc' ? 'asc' : 'desc';

            $q = SalesRecord::query();

            if (($actor->role ?? 'general') !== 'admin') {
                $actorDept = $actor->department_id;
                if ($actorDept === null) {
                    return [
                        'data' => [],
                        'current_page' => 1,
                        'last_page' => 1,
                        'total' => 0,
                    ];
                }

                $q->where('department_id', (int) $actorDept);
            }

            // Controller側で明示的にスコープした場合は優先（防御的）
            if (is_numeric($departmentId)) {
                $q->where('department_id', (int) $departmentId);
            }

            if ($keyword !== '') {
                $q->where('staff_name', 'like', '%'.$keyword.'%');
            }

            if (in_array($status, ['ok', 'ng'], true)) {
                $q->where('status', $status);
            }

            if ($dateFrom !== '') {
                $q->whereDate('date', '>=', $dateFrom);
            }
            if ($dateTo !== '') {
                $q->whereDate('date', '<=', $dateTo);
            }

            $perPage = 20;
            $total = (int) $q->count();
            $lastPage = (int) max(1, (int) ceil($total / $perPage));
            $page = min($page, $lastPage);

            $sortKey = $sort !== '' ? $sort : 'date';
            $allowed = [
                'id' => 'id',
                'staff_name' => 'staff_name',
                'status' => 'status',
                'date' => 'date',
            ];
            $sortCol = $allowed[$sortKey] ?? 'date';

            $data = $q
                ->orderBy($sortCol, $dir)
                ->orderByDesc('id')
                ->forPage($page, $perPage)
                ->get(['id', 'staff_name', 'status', 'date'])
                ->map(fn (SalesRecord $r) => [
                    'id' => (int) $r->id,
                    'staff_name' => (string) $r->staff_name,
                    'status' => (string) $r->status,
                    'date' => (string) $r->date?->format('Y-m-d'),
                ])
                ->all();

            return [
                'data' => $data,
                'current_page' => $page,
                'last_page' => $lastPage,
                'total' => $total,
            ];
        } catch (\Throwable $e) {
            Log::error('SalesRecordService.records failed', ['error' => $e->getMessage()]);
            return [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
            ];
        }
    }
}

