<?php

namespace App\Listeners;

use App\Events\KotPunchRecorded;
use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use App\Notifications\Discord\DiscordPayloadFactory;
use App\Support\DiscordWebhookResolver;

class QueueDiscordNotificationOnKotPunchRecorded
{
    public function handle(KotPunchRecorded $event): void
    {
        $target = DiscordWebhookResolver::forUser($event->user);
        if ($target === '') {
            return;
        }

        $payload = DiscordPayloadFactory::kotPunchRecorded(
            (string) ($event->user->name ?? '—'),
            (string) ($event->user->employee_code ?? ''),
            $event->outcome,
            $event->atIso,
            $event->httpStatus,
        );

        $log = DiscordNotificationLog::query()->create([
            'event_type' => 'kot.punch_recorded',
            'payload' => $payload,
            'triggered_by' => (int) $event->user->id,
            'webhook_url' => $target,
        ]);

        SendDiscordNotification::dispatch((int) $log->id);
    }
}
