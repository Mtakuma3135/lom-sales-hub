<?php

namespace App\Listeners;

use App\Events\LunchBreakScheduleUpdated;
use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use App\Notifications\Discord\DiscordPayloadFactory;

class QueueDiscordNotificationOnLunchBreakScheduleUpdated
{
    public function handle(LunchBreakScheduleUpdated $event): void
    {
        $actorName = (string) ($event->actor->name ?? '—');
        $payload = DiscordPayloadFactory::lunchBreakScheduleUpdated($actorName, $event->date);

        $log = DiscordNotificationLog::query()->create([
            'event_type' => 'lunch_break.schedule_updated',
            'payload' => $payload,
            'triggered_by' => (int) $event->actor->id,
        ]);

        SendDiscordNotification::dispatch((int) $log->id);
    }
}
