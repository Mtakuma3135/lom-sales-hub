<?php

namespace App\Console\Commands;

use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use App\Models\LunchBreak;
use App\Models\LunchBreakActive;
use App\Notifications\Discord\DiscordPayloadFactory;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class AlertLunchBreakNotStartedCommand extends Command
{
    protected $signature = 'lunch:alert-not-started';

    protected $description = '予定開始を過ぎても休憩スタートしていない先頭ユーザーを Discord に通知（重複はキャッシュで抑制）';

    public function handle(): int
    {
        if ((string) config('services.discord.webhook_url', '') === '') {
            return self::SUCCESS;
        }

        $today = now()->format('Y-m-d');
        $grace = 2;

        $names = [];
        foreach (range(1, 5) as $lane) {
            $plan = LunchBreak::query()
                ->with('user:id,name')
                ->whereDate('date', $today)
                ->where('lane', $lane)
                ->orderBy('start_time')
                ->orderBy('id')
                ->get();

            if ($plan->isEmpty()) {
                continue;
            }

            foreach ($plan as $res) {
                $uid = (int) $res->user_id;
                $active = LunchBreakActive::query()
                    ->whereDate('date', $today)
                    ->where('user_id', $uid)
                    ->first();

                if ($active && $active->finished_at !== null) {
                    continue;
                }

                $startRaw = substr((string) $res->start_time, 0, 8);
                $slotStart = CarbonImmutable::createFromFormat('Y-m-d H:i:s', $today.' '.$startRaw, config('app.timezone'));
                if ($slotStart === false) {
                    break;
                }

                if (now()->lt($slotStart->addMinutes($grace))) {
                    break;
                }

                if ($active?->started_at !== null) {
                    break;
                }

                $cacheKey = 'discord:lunch-not-started:'.$today.':'.$uid;
                if (! Cache::add($cacheKey, 1, now()->addMinutes(45))) {
                    break;
                }

                $name = trim((string) ($res->user?->name ?? ''));
                if ($name !== '') {
                    $names[] = $name;
                }

                break;
            }
        }

        if ($names === []) {
            return self::SUCCESS;
        }

        $payload = DiscordPayloadFactory::lunchBreakNotStartedAlert($today, array_values(array_unique($names)));
        $log = DiscordNotificationLog::query()->create([
            'event_type' => 'lunch_break.not_started_alert',
            'payload' => $payload,
            'triggered_by' => null,
        ]);
        SendDiscordNotification::dispatch((int) $log->id);

        return self::SUCCESS;
    }
}
