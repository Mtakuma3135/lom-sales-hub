<?php

namespace App\Jobs;

use App\Models\DiscordNotificationLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendDiscordNotification implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public $tries = 3;

    public $backoff = 60;

    public function __construct(public int $logId)
    {
    }

    public function handle(): void
    {
        $log = DiscordNotificationLog::query()->findOrFail($this->logId);

        $webhook = (string) config('services.discord.webhook_url', '');
        if ($webhook === '') {
            Log::warning('Discord webhook not configured; skipped sending.', [
                'event_type' => (string) $log->event_type,
                'log_id' => (int) $log->id,
            ]);

            $log->update([
                'error_message' => 'DISCORD_WEBHOOK_URL is not configured.',
            ]);

            return;
        }

        try {
            $payload = is_array($log->payload) ? $log->payload : [];

            $resp = Http::timeout(5)->post($webhook, $payload);

            $log->update([
                'status_code' => $resp->status(),
                'response_body' => mb_substr((string) $resp->body(), 0, 20000),
                'error_message' => $resp->successful() ? null : 'Discord webhook request failed.',
            ]);

            if (! $resp->successful()) {
                throw new \RuntimeException('Discord webhook request failed with status '.$resp->status().'.');
            }
        } catch (\Throwable $e) {
            // URLなどの機微情報はログしない
            Log::warning('Discord webhook send failed; will retry if possible.', [
                'event_type' => (string) $log->event_type,
                'log_id' => (int) $log->id,
                'attempt' => method_exists($this, 'attempts') ? $this->attempts() : null,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $e): void
    {
        DiscordNotificationLog::query()
            ->whereKey($this->logId)
            ->update([
                'error_message' => mb_substr($e->getMessage(), 0, 1000),
            ]);
    }
}

