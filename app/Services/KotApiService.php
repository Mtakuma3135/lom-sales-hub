<?php

namespace App\Services;

use App\Concerns\AuditLoggable;
use App\Jobs\SendKotPunchJob;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class KotApiService
{
    use AuditLoggable;

    private const DUP_WINDOW_SECONDS = 60;

    /**
     * @return array{status:'success'|'pending',message:string,elapsed_ms:int,source:string}
     */
    public function punch(User $user): array
    {
        $started = microtime(true);

        $employeeCode = (string) ($user->employee_code ?? '');
        if ($employeeCode === '') {
            abort(422, '社員コードが未設定です。');
        }

        $lockKey = 'kot:punch:'.$employeeCode;
        if (! Cache::add($lockKey, 1, self::DUP_WINDOW_SECONDS)) {
            abort(422, '打刻処理が進行中です（1分以内の重複はできません）。');
        }

        $atIso = now()->toISOString();
        $requestPayload = [
            'employee_code' => $employeeCode,
            'at' => $atIso,
        ];

        try {
            SendKotPunchJob::dispatch((int) $user->id, $atIso);

            $elapsed = (int) round((microtime(true) - $started) * 1000);

            $this->auditLog(
                integration: 'kot',
                eventType: 'punch_queued',
                status: 'pending',
                requestPayload: $requestPayload,
                actor: $user,
                meta: ['elapsed_ms' => $elapsed, 'source' => 'queue'],
            );

            return [
                'status' => 'pending',
                'message' => '打刻をキューに投入しました（処理中）。',
                'elapsed_ms' => $elapsed,
                'source' => 'queue',
            ];
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $elapsed = (int) round((microtime(true) - $started) * 1000);
            Log::warning('KotApiService.punch exception', ['error' => $e->getMessage()]);

            $this->auditLog(
                integration: 'kot',
                eventType: 'punch',
                status: 'failed',
                requestPayload: $requestPayload,
                errorMessage: $e->getMessage(),
                actor: $user,
                meta: ['elapsed_ms' => $elapsed, 'source' => 'exception'],
            );

            return [
                'status' => 'pending',
                'message' => '打刻の投入に失敗しました（後で再試行してください）。',
                'elapsed_ms' => $elapsed,
                'source' => 'exception',
            ];
        }
    }
}

