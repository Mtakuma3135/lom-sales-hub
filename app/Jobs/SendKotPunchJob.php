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

        $apiToken = (string) config('services.kot.api_token', '');
        $endpoint = 'https://api.kingtime.jp/v1/daily-workings/timerecord';

        $at = Carbon::parse($this->atIso);
        $payload = $kotService->buildPunchPayload($user, $at);

        if ($apiToken === '') {
            Log::info('SendKotPunchJob mock (no KOT_API_TOKEN)', [
                'endpoint' => $endpoint,
                'payload' => $payload,
            ]);

            $this->auditLog(
                integration: 'kot',
                eventType: 'punch',
                status: 'success',
                requestPayload: $payload,
                actor: $user,
                meta: ['mode' => 'mock', 'reason' => 'no_token'],
            );
            return;
        }

        try {
            $res = Http::timeout(5)
                ->acceptJson()
                ->withToken($apiToken)
                ->post($endpoint, [
                    // KOT仕様
                    'employeeCode' => $payload['employeeCode'],
                    'workingDate' => $payload['workingDate'],
                    'time' => $payload['time'],
                ]);

            if ($res->status() === 422) {
                // 既打刻（処理済み扱い）：例外を投げない
                $this->auditLog(
                    integration: 'kot',
                    eventType: 'punch',
                    status: 'success',
                    statusCode: 422,
                    requestPayload: $payload,
                    responseBody: $res->body(),
                    actor: $user,
                    meta: ['processed' => true],
                );
                return;
            }

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

