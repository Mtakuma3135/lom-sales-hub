<?php

namespace App\Services;

use App\Jobs\SendDiscordNotification;
use App\Models\AuditLog;
use App\Models\DiscordNotificationLog;
use App\Models\LunchBreak;
use App\Models\LunchBreakActive;
use App\Models\User;
use App\Notifications\Discord\DiscordPayloadFactory;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Session;

class LunchBreakService
{
    private const CAPACITY_PER_SLOT = 3;

    private const LANES = 3;

    /** タイムテーブル表示開始（30分刻み） */
    private const TIMETABLE_DAY_START = '11:00';

    /** タイムテーブル終了（この時刻の直前まで行を生成） */
    private const TIMETABLE_DAY_END = '15:00';

    private const ACTIVE_SESSION_KEY = 'lunch_breaks.active';

    private function lunchBreaksHasLaneColumn(): bool
    {
        return Schema::hasColumn('lunch_breaks', 'lane');
    }

    /**
     * lane 列が無い DB では SQL で order できないため、取得後に表示用 lane を付与する。
     *
     * @param  Collection<int, LunchBreak>  $reservations
     */
    private function hydrateVirtualLanes(Collection $reservations): void
    {
        if ($this->lunchBreaksHasLaneColumn()) {
            return;
        }

        $grouped = $reservations->groupBy(function (LunchBreak $r) {
            return $r->date->format('Y-m-d').'|'.substr((string) $r->start_time, 0, 5);
        });

        foreach ($grouped as $group) {
            foreach ($group->sortBy('id')->values() as $i => $r) {
                $r->setAttribute('lane', ($i % self::LANES) + 1);
            }
        }
    }

    /**
     * @param  Builder<LunchBreak>  $query
     */
    private function orderReservationsBySlot(Builder $query): Builder
    {
        $query->orderBy('start_time');
        if ($this->lunchBreaksHasLaneColumn()) {
            $query->orderBy('lane');
        }
        $query->orderBy('id');

        return $query;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function attributesForLunchBreakCreate(array $attributes): array
    {
        if (! $this->lunchBreaksHasLaneColumn()) {
            unset($attributes['lane']);
        }

        return $attributes;
    }

    /**
     * ホーム・API 用: 同一開始・終了の休憩をまとめたスロット一覧
     *
     * @return Collection<int, array{start_time:string,end_time:string,capacity:int,reservations:\Illuminate\Support\Collection<int,\App\Models\LunchBreak>}>
     */
    public function index(string $date): Collection
    {
        try {
            $reservations = $this->orderReservationsBySlot(
                LunchBreak::query()->with('user')->whereDate('date', $date)
            )->get();

            $this->hydrateVirtualLanes($reservations);

            if ($reservations->isEmpty()) {
                return collect();
            }

            $grouped = $reservations->groupBy(function (LunchBreak $r) {
                return substr((string) $r->start_time, 0, 5).'|'.substr((string) $r->end_time, 0, 5);
            });

            return $grouped->map(function (Collection $group, string $key) {
                [$start, $end] = explode('|', $key, 2);

                return [
                    'start_time' => $start,
                    'end_time' => $end,
                    'capacity' => self::CAPACITY_PER_SLOT,
                    'reservations' => $group->values(),
                ];
            })->values()->sortBy('start_time')->values();
        } catch (\Throwable $e) {
            Log::error('LunchBreakService.index failed', [
                'date' => $date,
                'error' => $e->getMessage(),
            ]);

            return $this->sampleIndex($date);
        }
    }

    /**
     * 昼休憩ページ: 30分 × 列（休憩枠1〜3）のグリッド
     *
     * @return array{rows: array<int, mixed>, lanes: int, day_start: string, day_end: string}
     */
    public function timetableGrid(string $date): array
    {
        $rows = $this->timetableRowMetas($date);
        $reservations = $this->orderReservationsBySlot(
            LunchBreak::query()->with('user')->whereDate('date', $date)
        )->get();

        $this->hydrateVirtualLanes($reservations);

        $gridRows = $rows->map(function (array $row) use ($reservations) {
            $cells = [];
            for ($lane = 1; $lane <= self::LANES; $lane++) {
                $hit = $reservations->first(function (LunchBreak $r) use ($row, $lane) {
                    return (int) $r->lane === $lane
                        && $this->intervalCoversRow($r, $row['time'], $row['end']);
                });
                $cells[] = [
                    'lane' => $lane,
                    'user' => $hit && $hit->user ? [
                        'id' => (int) $hit->user->id,
                        'name' => (string) ($hit->user->name ?? ''),
                    ] : null,
                    'reservation_id' => $hit ? (int) $hit->id : null,
                ];
            }

            return [
                'time' => $row['time'],
                'end' => $row['end'],
                'cells' => $cells,
            ];
        });

        return [
            'rows' => $gridRows->all(),
            'lanes' => self::LANES,
            'day_start' => self::TIMETABLE_DAY_START,
            'day_end' => self::TIMETABLE_DAY_END,
        ];
    }

    /**
     * @param  array<int, array{time:string,lane:int,user_id?:int|null}>  $cells
     */
    public function syncTimetable(User $actor, string $date, array $cells): void
    {
        $rowTimes = $this->timetableRowMetas($date)->pluck('time')->all();
        $rowSet = array_flip($rowTimes);

        $matrix = [];
        foreach (range(1, self::LANES) as $lane) {
            $matrix[$lane] = [];
            foreach ($rowTimes as $t) {
                $matrix[$lane][$t] = null;
            }
        }

        foreach ($cells as $c) {
            $t = (string) ($c['time'] ?? '');
            $lane = (int) ($c['lane'] ?? 0);
            if (! isset($rowSet[$t]) || $lane < 1 || $lane > self::LANES) {
                throw new \RuntimeException('Invalid timetable cell.', 422);
            }
            $uid = isset($c['user_id']) && $c['user_id'] !== null && $c['user_id'] !== '' ? (int) $c['user_id'] : null;
            $matrix[$lane][$t] = $uid ?: null;
        }

        $toCreate = [];
        foreach (range(1, self::LANES) as $lane) {
            $col = $matrix[$lane];
            $curUid = null;
            $segStart = null;
            $lastT = null;

            foreach ($rowTimes as $t) {
                $u = $col[$t] ?? null;
                if ($u !== $curUid) {
                    if ($curUid !== null && $segStart !== null && $lastT !== null) {
                        $toCreate[] = [
                            'user_id' => $curUid,
                            'lane' => $lane,
                            'start' => $segStart,
                            'end' => $this->rowEndTime($date, $lastT),
                        ];
                    }
                    $curUid = $u;
                    $segStart = $u !== null ? $t : null;
                }
                $lastT = $t;
            }
            if ($curUid !== null && $segStart !== null && $lastT !== null) {
                $toCreate[] = [
                    'user_id' => $curUid,
                    'lane' => $lane,
                    'start' => $segStart,
                    'end' => $this->rowEndTime($date, $lastT),
                ];
            }
        }

        $userIds = array_column($toCreate, 'user_id');
        if (count($userIds) !== count(array_unique($userIds))) {
            throw new \RuntimeException('同一ユーザーが複数枠に割り当てられています。', 422);
        }

        try {
            LunchBreak::query()->whereDate('date', $date)->delete();

            foreach ($toCreate as $seg) {
                $startAt = CarbonImmutable::createFromFormat('Y-m-d H:i', $date.' '.$seg['start']);
                if ($startAt === false) {
                    throw new \RuntimeException('Invalid segment start.', 422);
                }
                LunchBreak::query()->create($this->attributesForLunchBreakCreate([
                    'user_id' => $seg['user_id'],
                    'date' => $date,
                    'start_time' => $startAt->format('H:i:s'),
                    'end_time' => $seg['end'],
                    'lane' => $seg['lane'],
                ]));
            }

            $users = User::query()
                ->whereIn('id', $userIds)
                ->get(['id', 'name', 'role']);

            if ($users->isNotEmpty()) {
                $this->notifyAssignedUsers($users, '—', '—');
            }

            $this->pushLunchScheduleToGas($date);
        } catch (\Throwable $e) {
            Log::error('LunchBreakService.syncTimetable failed', [
                'actor_id' => $actor->id,
                'date' => $date,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function pushLunchScheduleToGas(string $date): void
    {
        $base = trim((string) config('services.gas.lunch_schedule_url', ''));
        if ($base === '') {
            $base = trim((string) config('services.gas.dummy_url', ''));
        }
        if ($base === '') {
            return;
        }

        try {
            $grid = $this->timetableGrid($date);
            app(GasWebhookService::class)->post(
                [
                    'event' => 'lunch_schedule_sync',
                    'date' => $date,
                    'rows' => $grid['rows'],
                    'lanes' => $grid['lanes'],
                    'timestamp' => now()->timestamp,
                    'sent_at' => now()->toISOString(),
                ],
                'lunch_schedule.sync',
                LunchBreak::class,
                null,
                false,
                $base,
            );
        } catch (\Throwable $e) {
            Log::warning('LunchBreakService.pushLunchScheduleToGas failed', [
                'date' => $date,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function store(User $actor, string $date, string $startTime): LunchBreak
    {
        try {
            $this->assertTimeSlotRule($startTime);

            $start = CarbonImmutable::createFromFormat('Y-m-d H:i', $date.' '.$startTime);
            if ($start === false) {
                throw new \RuntimeException('Invalid datetime.', 422);
            }

            if (now()->greaterThanOrEqualTo($start)) {
                throw new \RuntimeException('Reservation can not be changed after start.', 409);
            }

            $already = LunchBreak::query()
                ->where('user_id', $actor->id)
                ->whereDate('date', $date)
                ->exists();

            if ($already) {
                throw new \RuntimeException('Duplicate reservation is not allowed.', 409);
            }

            $count = LunchBreak::query()
                ->whereDate('date', $date)
                ->where('start_time', $startTime)
                ->count();

            if ($count >= self::CAPACITY_PER_SLOT) {
                throw new \RuntimeException('Slot is full.', 409);
            }

            $end = $start->addMinutes(60);

            $lane = $count + 1;

            return LunchBreak::query()->create($this->attributesForLunchBreakCreate([
                'user_id' => $actor->id,
                'date' => $date,
                'start_time' => $startTime,
                'end_time' => $end->format('H:i:s'),
                'lane' => $lane,
            ]));
        } catch (\Throwable $e) {
            Log::error('LunchBreakService.store failed', [
                'user_id' => $actor->id,
                'date' => $date,
                'start_time' => $startTime,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function destroy(User $actor, int $id): void
    {
        try {
            $reservation = LunchBreak::query()->with('user')->findOrFail($id);

            $start = CarbonImmutable::createFromFormat(
                'Y-m-d H:i:s',
                $reservation->date->format('Y-m-d').' '.$reservation->start_time
            );

            if ($start !== false && now()->greaterThanOrEqualTo($start)) {
                throw new \RuntimeException('Reservation can not be changed after start.', 409);
            }

            $reservation->delete();
        } catch (\Throwable $e) {
            Log::error('LunchBreakService.destroy failed', [
                'user_id' => $actor->id,
                'reservation_id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * @param  array<int,int>  $userIds
     */
    public function assign(User $actor, string $date, string $startTime, array $userIds): void
    {
        try {
            $this->assertTimeSlotRule($startTime);

            $start = CarbonImmutable::createFromFormat('Y-m-d H:i', $date.' '.$startTime);
            if ($start === false) {
                throw new \RuntimeException('Invalid datetime.', 422);
            }

            if (count($userIds) > self::CAPACITY_PER_SLOT) {
                throw new \RuntimeException('Slot is full.', 409);
            }

            $alreadyUserIds = LunchBreak::query()
                ->whereDate('date', $date)
                ->whereIn('user_id', $userIds)
                ->pluck('user_id')
                ->all();

            $userIds = array_values(array_diff($userIds, array_map('intval', $alreadyUserIds)));

            LunchBreak::query()
                ->whereDate('date', $date)
                ->where('start_time', 'like', $startTime.':%')
                ->delete();

            $end = $start->addMinutes(60);

            $users = User::query()
                ->whereIn('id', $userIds)
                ->get(['id', 'name', 'role']);

            foreach ($users->values() as $idx => $u) {
                LunchBreak::query()->create($this->attributesForLunchBreakCreate([
                    'user_id' => $u->id,
                    'date' => $date,
                    'start_time' => $startTime,
                    'end_time' => $end->format('H:i:s'),
                    'lane' => $idx + 1,
                ]));
            }

            $this->notifyAssignedUsers($users, $startTime, $end->format('H:i'));
            $this->pushLunchScheduleToGas($date);
        } catch (\Throwable $e) {
            Log::error('LunchBreakService.assign failed', [
                'actor_id' => $actor->id,
                'date' => $date,
                'start_time' => $startTime,
                'user_ids' => $userIds,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function notifyAssignedUsers(Collection $users, string $startTime, string $endTime): bool
    {
        try {
            $payload = DiscordPayloadFactory::lunchBreakAssigned(
                $users
                    ->map(fn (User $u) => ['id' => (int) $u->id, 'name' => (string) ($u->name ?? '')])
                    ->values()
                    ->all(),
                $startTime,
                $endTime
            );

            $log = DiscordNotificationLog::query()->create([
                'event_type' => 'lunch_break.assignment',
                'payload' => $payload,
                'triggered_by' => null,
            ]);

            SendDiscordNotification::dispatch((int) $log->id);

            return true;
        } catch (\Throwable $e) {
            Log::warning('LunchBreakService.notifyAssignedUsers exception', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function complete(User $user, string $date): bool
    {
        try {
            try {
                LunchBreakActive::query()
                    ->whereDate('date', $date)
                    ->where('user_id', (int) $user->id)
                    ->delete();
            } catch (\Throwable $e) {
                // ignore (DB未マイグレーションなど)
            }

            $payload = DiscordPayloadFactory::lunchBreakEnded((string) ($user->name ?? ''));

            $log = DiscordNotificationLog::query()->create([
                'event_type' => 'lunch_break.end',
                'payload' => $payload,
                'triggered_by' => (int) $user->id,
            ]);

            SendDiscordNotification::dispatch((int) $log->id);

            return true;
        } catch (\Throwable $e) {
            Log::warning('LunchBreakService.complete exception', [
                'user_id' => $user->id,
                'date' => $date,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function activeStatus(string $date): array
    {
        try {
            $plannedByLane = LunchBreak::query()
                ->with('user:id,name,role')
                ->whereDate('date', $date)
                ->orderBy('start_time')
                ->get()
                ->groupBy(fn (LunchBreak $r) => (int) ($r->lane ?? 1));

            $now = now();

            $result = [];
            foreach (range(1, self::LANES) as $lane) {
                /** @var Collection<int, LunchBreak> $plan */
                $plan = $plannedByLane[$lane] ?? collect();
                $userIds = $plan->pluck('user_id')->map(fn ($id) => (int) $id)->unique()->values();

                $current = LunchBreakActive::query()
                    ->with('user:id,name,role')
                    ->whereDate('date', $date)
                    ->where('lane', $lane)
                    ->whereNotNull('started_at')
                    ->whereNull('finished_at')
                    ->orderByDesc('started_at')
                    ->first();

                if ($current && $current->started_at) {
                    $elapsedSec = $current->started_at->diffInSeconds($now);
                    $totalSec = (int) ($current->duration_minutes ?? 60) * 60;
                    if ($elapsedSec >= $totalSec) {
                        $current->started_at = null;
                        $current->finished_at = $now;
                        $current->save();
                        $current = null;
                    }
                }

                if (! $current) {
                    // 待機中（次に走る人）を決める
                    $nextUserId = null;
                    foreach ($userIds as $uid) {
                        $ar = LunchBreakActive::query()->whereDate('date', $date)->where('user_id', $uid)->first();
                        if ($ar && $ar->finished_at !== null) {
                            continue;
                        }
                        $nextUserId = $uid;
                        break;
                    }
                    if ($nextUserId !== null) {
                        $plannedStart = substr((string) ($plan->firstWhere('user_id', $nextUserId)?->start_time ?? ''), 0, 5) ?: null;
                        $current = LunchBreakActive::query()->updateOrCreate(
                            ['date' => $date, 'user_id' => $nextUserId],
                            [
                                'lane' => $lane,
                                'planned_start_time' => $plannedStart,
                                'started_at' => null,
                                'finished_at' => null,
                                'duration_minutes' => 60,
                                'updated_by' => null,
                            ]
                        );
                        $current->loadMissing('user:id,name,role');
                    }
                }

                $currentId = $current ? (int) $current->user_id : null;
                $nextId = null;
                if ($currentId !== null) {
                    $found = false;
                    foreach ($userIds as $uid) {
                        if (! $found) {
                            if ($uid === $currentId) $found = true;
                            continue;
                        }
                        $ar = LunchBreakActive::query()->whereDate('date', $date)->where('user_id', $uid)->first();
                        if ($ar && $ar->finished_at !== null) continue;
                        $nextId = $uid;
                        break;
                    }
                }

                $nextUser = $nextId ? ($plan->firstWhere('user_id', $nextId)?->user ?? null) : null;

                $result[] = [
                    'date' => $date,
                    'lane' => $lane,
                    'current' => [
                        'user' => $current && $current->user ? ['id' => (int) $current->user->id, 'name' => (string) ($current->user->name ?? '')] : null,
                        'planned_start_time' => $current?->planned_start_time,
                        'started_at' => $current?->started_at?->toISOString(),
                        'finished_at' => $current?->finished_at?->toISOString(),
                        'duration_minutes' => (int) ($current?->duration_minutes ?? 60),
                    ],
                    'next' => [
                        'user' => $nextUser ? ['id' => (int) $nextUser->id, 'name' => (string) ($nextUser->name ?? '')] : null,
                    ],
                ];
            }

            return $result;
        } catch (\Throwable $e) {
            // 互換: 旧セッション方式（DB未マイグレーション時）
            $all = Session::get(self::ACTIVE_SESSION_KEY, []);
            if (! is_array($all)) {
                return [];
            }
            $rows = $all[$date] ?? [];

            return is_array($rows) ? array_values($rows) : [];
        }
    }

    /**
     * @return array<string, mixed>
     */
    /**
     * 枠（lane）をスタート。割付順で「未完走の次の人」を開始する。
     *
     * @return array<string, mixed>
     */
    public function startLaneTimer(User $actor, string $date, int $lane): array
    {
        $now = now();

        try {
            $plan = LunchBreak::query()
                ->with('user:id,name,role')
                ->whereDate('date', $date)
                ->where('lane', $lane)
                ->orderBy('start_time')
                ->get();
            $userIds = $plan->pluck('user_id')->map(fn ($id) => (int) $id)->unique()->values();
            if ($userIds->isEmpty()) {
                throw new \RuntimeException('No planned user in lane.', 422);
            }

            $current = LunchBreakActive::query()
                ->whereDate('date', $date)
                ->where('lane', $lane)
                ->whereNotNull('started_at')
                ->whereNull('finished_at')
                ->orderByDesc('started_at')
                ->first();
            if ($current) {
                $current->loadMissing('user:id,name,role');
                return [
                    'date' => $date,
                    'lane' => $lane,
                    'user' => [
                        'id' => (int) $current->user_id,
                        'name' => (string) ($current->user?->name ?? ''),
                    ],
                    'active' => ['started_at' => $current->started_at?->toISOString()],
                ];
            }

            $nextUserId = null;
            foreach ($userIds as $uid) {
                $ar = LunchBreakActive::query()->whereDate('date', $date)->where('user_id', $uid)->first();
                if ($ar && $ar->finished_at !== null) continue;
                $nextUserId = $uid;
                break;
            }
            if ($nextUserId === null) {
                throw new \RuntimeException('No next user in lane.', 422);
            }

            $plannedStart = substr((string) ($plan->firstWhere('user_id', $nextUserId)?->start_time ?? ''), 0, 5) ?: null;
            $row = LunchBreakActive::query()->updateOrCreate(
                ['date' => $date, 'user_id' => $nextUserId],
                [
                    'lane' => $lane,
                    'planned_start_time' => $plannedStart,
                    'started_at' => $now,
                    'finished_at' => null,
                    'duration_minutes' => 60,
                    'updated_by' => (int) $actor->id,
                ]
            );
            $row->loadMissing('user:id,name,role');

            return [
                'date' => $date,
                'lane' => $lane,
                'user' => [
                    'id' => (int) $nextUserId,
                    'name' => (string) ($row->user?->name ?? ''),
                ],
                'active' => ['started_at' => $now->toISOString()],
            ];
        } catch (\Throwable $e) {
            // 互換: 旧セッション方式（最低限）
            /** @var array<string, mixed> $all */
            $all = Session::get(self::ACTIVE_SESSION_KEY, []);
            $all = is_array($all) ? $all : [];
            $all[$date] = is_array($all[$date] ?? null) ? $all[$date] : [];
            $all[$date][(string) $lane] = [
                'date' => $date,
                'lane' => $lane,
                'active' => ['started_at' => $now->toISOString()],
            ];
            Session::put(self::ACTIVE_SESSION_KEY, $all);

            return $all[$date][(string) $lane];
        }
    }

    public function stopLaneTimer(User $actor, string $date, int $lane): bool
    {
        try {
            $row = LunchBreakActive::query()
                ->whereDate('date', $date)
                ->where('lane', $lane)
                ->whereNotNull('started_at')
                ->whereNull('finished_at')
                ->orderByDesc('started_at')
                ->first();
            if (! $row) {
                return true;
            }
            $row->started_at = null;
            $row->updated_by = (int) $actor->id;
            $row->save();

            return true;
        } catch (\Throwable $e) {
            // 互換: セッション方式
            /** @var array<string, mixed> $all */
            $all = Session::get(self::ACTIVE_SESSION_KEY, []);
            $all = is_array($all) ? $all : [];
            $all[$date] = is_array($all[$date] ?? null) ? $all[$date] : [];
            unset($all[$date][(string) $lane]);
            Session::put(self::ACTIVE_SESSION_KEY, $all);

            return true;
        }
    }

    public function resetLaneTimer(User $actor, string $date, int $lane): bool
    {
        try {
            $row = LunchBreakActive::query()
                ->whereDate('date', $date)
                ->where('lane', $lane)
                ->orderByDesc('updated_at')
                ->first();
            if ($row) {
                $row->started_at = null;
                $row->finished_at = null;
                $row->updated_by = (int) $actor->id;
                $row->save();
            }

            return true;
        } catch (\Throwable $e) {
            // 互換: セッション方式
            /** @var array<string, mixed> $all */
            $all = Session::get(self::ACTIVE_SESSION_KEY, []);
            $all = is_array($all) ? $all : [];
            $all[$date] = is_array($all[$date] ?? null) ? $all[$date] : [];
            unset($all[$date][(string) $lane]);
            Session::put(self::ACTIVE_SESSION_KEY, $all);

            return true;
        }
    }

    /**
     * @return Collection<int, array{time:string,end:string}>
     */
    private function timetableRowMetas(string $date): Collection
    {
        $start = CarbonImmutable::createFromFormat('Y-m-d H:i', $date.' '.self::TIMETABLE_DAY_START);
        $endLimit = CarbonImmutable::createFromFormat('Y-m-d H:i', $date.' '.self::TIMETABLE_DAY_END);

        if ($start === false || $endLimit === false) {
            return collect();
        }

        $rows = collect();
        $cursor = $start;
        while ($cursor->lessThan($endLimit)) {
            $rowStart = $cursor->format('H:i');
            $next = $cursor->addMinutes(30);
            $rows->push(['time' => $rowStart, 'end' => $next->format('H:i')]);
            $cursor = $next;
        }

        return $rows;
    }

    private function rowEndTime(string $date, string $lastRowStart): string
    {
        $t = CarbonImmutable::createFromFormat('Y-m-d H:i', $date.' '.$lastRowStart);
        if ($t === false) {
            return '00:00:00';
        }

        return $t->addMinutes(30)->format('H:i:s');
    }

    private function intervalCoversRow(LunchBreak $r, string $rowStart, string $rowEnd): bool
    {
        $a = $this->timeToMinutes($rowStart);
        $b = $this->timeToMinutes($rowEnd);
        $s = $this->timeToMinutes(substr((string) $r->start_time, 0, 5));
        $e = $this->timeToMinutes(substr((string) $r->end_time, 0, 5));

        return $s < $b && $e > $a;
    }

    private function timeToMinutes(string $hm): int
    {
        $parts = explode(':', $hm);
        $h = (int) ($parts[0] ?? 0);
        $m = (int) ($parts[1] ?? 0);

        return $h * 60 + $m;
    }

    private function assertTimeSlotRule(string $startTime): void
    {
        if (! preg_match('/^\d{2}:\d{2}$/', $startTime)) {
            throw new \RuntimeException('Invalid slot.', 422);
        }
        if (! str_ends_with($startTime, ':00') && ! str_ends_with($startTime, ':30')) {
            throw new \RuntimeException('Invalid slot.', 422);
        }
    }

    /**
     * @return Collection<int, array{start_time:string,end_time:string,capacity:int,reservations:\Illuminate\Support\Collection<int,\App\Models\LunchBreak>}>
     */
    private function sampleIndex(string $date): Collection
    {
        $fake = collect([
            new LunchBreak([
                'id' => 1,
                'user_id' => 1,
                'date' => $date,
                'start_time' => '12:00:00',
                'end_time' => '13:00:00',
                'lane' => 1,
            ]),
            new LunchBreak([
                'id' => 2,
                'user_id' => 2,
                'date' => $date,
                'start_time' => '13:00:00',
                'end_time' => '14:00:00',
                'lane' => 1,
            ]),
        ])->map(function (LunchBreak $lb) {
            $lb->setRelation('user', new User([
                'id' => $lb->user_id,
                'name' => $lb->user_id === 1 ? '山田太郎' : '佐藤花子',
                'role' => 'general',
            ]));

            return $lb;
        });

        return $fake
            ->groupBy(fn (LunchBreak $r) => substr((string) $r->start_time, 0, 5).'|'.substr((string) $r->end_time, 0, 5))
            ->map(function (Collection $group, string $key) {
                [$start, $end] = explode('|', $key, 2);

                return [
                    'start_time' => $start,
                    'end_time' => $end,
                    'capacity' => self::CAPACITY_PER_SLOT,
                    'reservations' => $group->values(),
                ];
            })->values()->sortBy('start_time')->values();
    }
}
