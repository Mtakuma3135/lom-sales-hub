<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KotService
{
    /**
     * KOT仕様に合わせて日時を workingDate/time に分割する。
     *
     * @return array{workingDate:string,time:string}
     */
    public function splitWorkingDateTime(\DateTimeInterface $at): array
    {
        $c = Carbon::instance($at);

        return [
            'workingDate' => $c->format('Y-m-d'),
            'time' => $c->format('H:i'),
        ];
    }

    /**
     * @return array{employeeCode:string,workingDate:string,time:string}
     */
    public function buildPunchPayload(User $user, \DateTimeInterface $at): array
    {
        $employeeCode = (string) ($user->employee_code ?? '');
        $split = $this->splitWorkingDateTime($at);

        return [
            'employeeCode' => $employeeCode,
            'workingDate' => $split['workingDate'],
            'time' => $split['time'],
        ];
    }

    /**
     * @return array{success:bool,source:string,elapsed_ms:int,message:string}
     */
    public function simulatePunch(): array
    {
        $started = microtime(true);

        try {
            $url = (string) config('services.kot.mock_url', '');
            if ($url === '') {
                // 自サーバーのダミー（web側に用意する）
                $url = route('portal.mock.kot.punch');
            }

            $res = Http::timeout(3)->post($url, [
                'kind' => 'punch',
                'at' => now()->toISOString(),
            ]);

            $elapsed = (int) round((microtime(true) - $started) * 1000);

            if (! $res->successful()) {
                return [
                    'success' => false,
                    'source' => $url,
                    'elapsed_ms' => $elapsed,
                    'message' => 'KOT mock request failed',
                ];
            }

            return [
                'success' => true,
                'source' => $url,
                'elapsed_ms' => $elapsed,
                'message' => 'KOT punch simulated',
            ];
        } catch (\Throwable $e) {
            $elapsed = (int) round((microtime(true) - $started) * 1000);
            Log::warning('KotService.simulatePunch failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'source' => 'exception',
                'elapsed_ms' => $elapsed,
                'message' => 'KOT mock request exception',
            ];
        }
    }
}

