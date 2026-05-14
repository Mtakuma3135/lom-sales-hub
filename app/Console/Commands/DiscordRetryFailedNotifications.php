<?php

namespace App\Console\Commands;

use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use Illuminate\Console\Command;

class DiscordRetryFailedNotifications extends Command
{
    protected $signature = 'discord:retry-failed {--limit=50 : Max number of failed logs to retry}';

    protected $description = 'Re-dispatch failed/pending Discord notifications with audit log.';

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $failed = DiscordNotificationLog::query()
            ->where(function ($q): void {
                $q->whereNull('status_code')->orWhere('status_code', '>=', 300);
            })
            ->orderBy('id')
            ->limit($limit)
            ->get(['id', 'event_type', 'payload', 'webhook_url']);

        if ($failed->isEmpty()) {
            $this->info('No failed/pending logs found.');

            return self::SUCCESS;
        }

        $count = 0;
        foreach ($failed as $base) {
            $log = DiscordNotificationLog::query()->create([
                'parent_id' => (int) $base->id,
                'event_type' => (string) $base->event_type,
                'payload' => $base->payload,
                'triggered_by' => null,
                'webhook_url' => $base->webhook_url,
            ]);
            SendDiscordNotification::dispatch((int) $log->id);
            $count++;
        }

        $this->info("Dispatched {$count} retry jobs.");

        return self::SUCCESS;
    }
}
