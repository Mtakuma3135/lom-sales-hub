<?php

namespace App\Jobs;

use App\Concerns\AuditLoggable;
use App\Models\User;
use App\Services\KotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendKotPunchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    use AuditLoggable;

    public $tries = 3;

    public $backoff = 60;

    public function __construct(
        public int $userId,
        public string $atIso,
    ) {
    }

    public function handle(KotService $kotService): void
    {
        $user = User::query()->findOrFail($this->userId);

        $employeeCode = (string) ($user->employee_code ?? '');
        if ($employeeCode === '') {
            $this->auditLog(
                integration: 'kot',
                eventType: 'punch',
                status: 'failed',
                requestPayload: ['user_id' => $user->id, 'at' => $this->atIso],
                errorMessage: 'employee_code is empty',
                actor: $user,
            );
            return;
        }

        $apiUrl = (string) config('services.kot.api_url', '');
        $apiToken = (string) config('services.kot.api_token', '');

        $at = Carbon::parse($this->atIso);
        $payload = $kotService->buildPunchPayload($user, $at);

        if ($apiUrl === '' || $apiToken === '') {
            // 本番URL未設定時は「処理保留」として監査ログだけ残す
            $this->auditLog(
                integration: 'kot',
                eventType: 'punch',
                status: 'pending',
                requestPayload: $payload,
                actor: $user,
                meta: ['reason' => 'not_configured'],
            );
            return;
        }

        try {
            $res = Http::timeout(5)
                ->acceptJson()
                ->withToken($apiToken)
                ->post(rtrim($apiUrl, '/').'/punch', [
                    // KOT仕様
                    'employeeCode' => $payload['employeeCode'],
                    'workingDate' => $payload['workingDate'],
                    'time' => $payload['time'],
                ]);

            $this->auditLog(
                integration: 'kot',
                eventType: 'punch',
                status: $res->successful() ? 'success' : 'failed',
                statusCode: $res->status(),
                requestPayload: $payload,
                responseBody: $res->body(),
                actor: $user,
            );

            if (! $res->successful()) {
                throw new \RuntimeException('KOT punch failed with status '.$res->status().'.');
            }
        } catch (\Throwable $e) {
            Log::warning('SendKotPunchJob failed; will retry if possible', [
                'user_id' => (int) $user->id,
                'error' => $e->getMessage(),
            ]);

            $this->auditLog(
                integration: 'kot',
                eventType: 'punch',
                status: 'failed',
                requestPayload: $payload,
                errorMessage: $e->getMessage(),
                actor: $user,
            );

            throw $e;
        }
    }
}

