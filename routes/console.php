<?php

use App\Jobs\SendDiscordNotification;
use App\Models\DiscordNotificationLog;
use App\Services\GasWebhookService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('discord:test', function () {
    if ((string) config('services.discord.webhook_url', '') === '') {
        $this->error('DISCORD_WEBHOOK_URL（または互換の GOOGLE_CHAT_WEBHOOK_URL）が未設定です。');

        return 1;
    }

    $log = DiscordNotificationLog::query()->create([
        'event_type' => 'manual.test',
        'payload' => [
            'content' => '[テスト] LOM Sales Hub 接続確認 '.now()->toDateTimeString(),
        ],
        'triggered_by' => null,
    ]);

    try {
        SendDiscordNotification::dispatchSync((int) $log->id);
    } catch (\Throwable $e) {
        $this->error('送信ジョブでエラー: '.$e->getMessage());
        $this->warn('discord_notification_logs ID '.$log->id.' は作成済みです。管理画面の Discord ログで確認してください。');

        return 1;
    }

    $log->refresh();

    $this->info('Discord へ送信し、ログを保存しました。');
    $this->line('discord_notification_logs.id = '.$log->id);
    $this->line('status_code = '.($log->status_code !== null ? (string) $log->status_code : '(null)'));
    if ($log->error_message) {
        $this->warn('error_message: '.$log->error_message);
    }

    $payload = is_array($log->payload) ? $log->payload : [];
    $preview = (string) ($payload['content'] ?? '');

    $gasResult = app(GasWebhookService::class)->post(
        [
            'event' => 'manual.discord_test',
            'discord_notification_log_id' => (int) $log->id,
            'discord_message_preview' => mb_substr($preview, 0, 500),
            'timestamp' => now()->timestamp,
            'sent_at' => now()->toISOString(),
        ],
        'manual.discord_test',
        DiscordNotificationLog::class,
        (int) $log->id,
        preferAuditLogUrl: true,
    );

    if ($gasResult === 'skipped') {
        $this->warn('GAS: スキップ（GAS_AUDIT_LOG_URL / GAS_DUMMY_URL いずれも未設定）。監査ログに skipped が残ります。');
    } elseif ($gasResult === 'success') {
        $this->info('GAS: 送信成功。監査ログ（integration=gas, event_type=manual.discord_test）を確認してください。');
    } else {
        $this->warn('GAS: 送信失敗。監査ログに failed が残ります。URL・ネットワーク・GAS の doPost を確認してください。');
    }

    return 0;
})->purpose('Discord テスト送信 → discord_notification_logs 記録 → GAS へテストペイロード送信（監査ログ記録）');
