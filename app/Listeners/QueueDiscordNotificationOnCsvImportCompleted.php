<?php

namespace App\Listeners;

use App\Events\CsvImportCompleted;
use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use App\Notifications\Discord\DiscordPayloadFactory;

class QueueDiscordNotificationOnCsvImportCompleted
{
    public function handle(CsvImportCompleted $event): void
    {
        $payload = DiscordPayloadFactory::csvCompleted(
            $event->uploadId,
            $event->filename,
            $event->successCount,
            $event->failedCount,
        );

        $log = DiscordNotificationLog::query()->create([
            'event_type' => 'csv.completion',
            'payload' => $payload,
            'triggered_by' => $event->actor?->id,
        ]);

        SendDiscordNotification::dispatch((int) $log->id);
    }
}
