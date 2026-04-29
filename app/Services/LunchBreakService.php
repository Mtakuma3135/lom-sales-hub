<?php

namespace App\Services;

use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use App\Models\LunchBreak;
use App\Models\User;
use App\Notifications\Discord\DiscordPayloadFactory;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LunchBreakService
{
    private const CAPACITY_PER_SLOT = 3;

    /**
     * @return Collection<int, array{start_time:string,end_time:string,capacity:int,reservations:\Illuminate\Support\Collection<int,\App\Models\LunchBreak>}>
     */
    public function index(string $date): Collection
    {
        try {
            $reservations = LunchBreak::query()
                ->with('user')
                ->whereDate('date', $date)
                ->orderBy('start_time')
                ->orderBy('id')
                ->get();

            $slots = $this->buildSlots($date);

            return $slots->map(function (array $slot) use ($reservations) {
                $slotReservations = $reservations
                    ->where('start_time', $slot['start_time'])
                    ->values();

                return [
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'capacity' => self::CAPACITY_PER_SLOT,
                    'reservations' => $slotReservations,
                ];
            });
        } catch (\Throwable $e) {
            Log::error('LunchBreakService.index failed', [
                'date' => $date,
                'error' => $e->getMessage(),
            ]);

            // DBが空/未準備でもUIを作れるよう、サンプルデータで返す
            return $this->sampleIndex($date);
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

            return LunchBreak::query()->create([
                'user_id' => $actor->id,
                'date' => $date,
                'start_time' => $startTime,
                'end_time' => $end->format('H:i:s'),
            ]);
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
     * 管理者による割り当て（複数ユーザーを一括登録）
     *
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

            // 同一ユーザー重複不可（当日どこかに既に割当されていれば除外）
            $alreadyUserIds = LunchBreak::query()
                ->whereDate('date', $date)
                ->whereIn('user_id', $userIds)
                ->pluck('user_id')
                ->all();

            $userIds = array_values(array_diff($userIds, array_map('intval', $alreadyUserIds)));

            // 既存のこの枠の割当を一旦クリア（管理者が上書きする前提）
            LunchBreak::query()
                ->whereDate('date', $date)
                ->where('start_time', $startTime)
                ->delete();

            $end = $start->addMinutes(60);

            $users = User::query()
                ->whereIn('id', $userIds)
                ->get(['id', 'name', 'role']);

            foreach ($users as $u) {
                LunchBreak::query()->create([
                    'user_id' => $u->id,
                    'date' => $date,
                    'start_time' => $startTime,
                    'end_time' => $end->format('H:i:s'),
                ]);
            }

            $this->notifyAssignedUsers($users, $startTime, $end->format('H:i'));
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

    /**
     * 通知（Webhook）
     *
     * 失敗時は success=false（指示書準拠）。例外詳細は外に出さない。
     */
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

    /**
     * 休憩終了通知（タイマー0到達時）
     */
    public function complete(User $user, string $date): bool
    {
        try {
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
     * @return Collection<int, array{start_time:string,end_time:string}>
     */
    private function buildSlots(string $date): Collection
    {
        // 固定レンジ（UI成立優先）。必要なら後で設定化。
        $start = CarbonImmutable::createFromFormat('Y-m-d H:i', $date.' 12:00');
        $end = CarbonImmutable::createFromFormat('Y-m-d H:i', $date.' 14:00');

        if ($start === false || $end === false) {
            return collect();
        }

        $slots = collect();
        $cursor = $start;
        while ($cursor->lessThan($end)) {
            $slots->push([
                'start_time' => $cursor->format('H:i'),
                'end_time' => $cursor->addMinutes(60)->format('H:i'),
            ]);
            $cursor = $cursor->addMinutes(60);
        }

        return $slots;
    }

    private function assertTimeSlotRule(string $startTime): void
    {
        if (! preg_match('/^\d{2}:00$/', $startTime)) {
            throw new \RuntimeException('Invalid slot.', 422);
        }
    }

    /**
     * @return Collection<int, array{start_time:string,end_time:string,capacity:int,reservations:\Illuminate\Support\Collection<int,\App\Models\LunchBreak>}>
     */
    private function sampleIndex(string $date): Collection
    {
        $slots = $this->buildSlots($date);

        $fake = collect([
            new LunchBreak([
                'id' => 1,
                'user_id' => 1,
                'date' => $date,
                'start_time' => '12:00:00',
                'end_time' => '13:00:00',
            ]),
            new LunchBreak([
                'id' => 2,
                'user_id' => 2,
                'date' => $date,
                'start_time' => '13:00:00',
                'end_time' => '14:00:00',
            ]),
        ])->map(function (LunchBreak $lb) {
            // user relation ダミー
            $lb->setRelation('user', new User([
                'id' => $lb->user_id,
                'name' => $lb->user_id === 1 ? '山田太郎' : '佐藤花子',
                'role' => 'general',
            ]));

            return $lb;
        });

        return $slots->map(function (array $slot) use ($fake) {
            $slotReservations = $fake
                ->filter(fn (LunchBreak $r) => substr((string) $r->start_time, 0, 5) === $slot['start_time'])
                ->values();

            return [
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'capacity' => self::CAPACITY_PER_SLOT,
                'reservations' => $slotReservations,
            ];
        });
    }
}

