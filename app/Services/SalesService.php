<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SalesService
{
    /**
     * @return array{summary:array{ok:int,ng:int,contract_rate:float},ranking:\Illuminate\Support\Collection<int,array{rank:int,name:string,ok:int,ng:int,rate:float}>,trend:\Illuminate\Support\Collection<int,array{label:string,ok:int,ng:int,rate:float}>}
     */
    public function summary(): array
    {
        try {
            $ok = 137;
            $ng = 63;
            $contractRate = ($ok + $ng) === 0 ? 0.0 : round(($ok / ($ok + $ng)) * 100, 1);

            $ranking = collect([
                ['rank' => 1, 'name' => '山田太郎', 'ok' => 34, 'ng' => 9],
                ['rank' => 2, 'name' => '佐藤花子', 'ok' => 29, 'ng' => 11],
                ['rank' => 3, 'name' => '鈴木一郎', 'ok' => 24, 'ng' => 12],
                ['rank' => 4, 'name' => '高橋次郎', 'ok' => 21, 'ng' => 14],
                ['rank' => 5, 'name' => '田中美咲', 'ok' => 19, 'ng' => 17],
            ])->map(function (array $r) {
                $rate = ($r['ok'] + $r['ng']) === 0 ? 0.0 : round(($r['ok'] / ($r['ok'] + $r['ng'])) * 100, 1);
                return $r + ['rate' => $rate];
            })->values();

            $trend = collect([
                ['label' => 'W1', 'ok' => 28, 'ng' => 19],
                ['label' => 'W2', 'ok' => 33, 'ng' => 14],
                ['label' => 'W3', 'ok' => 38, 'ng' => 12],
                ['label' => 'W4', 'ok' => 38, 'ng' => 18],
            ])->map(function (array $t) {
                $rate = ($t['ok'] + $t['ng']) === 0 ? 0.0 : round(($t['ok'] / ($t['ok'] + $t['ng'])) * 100, 1);
                return $t + ['rate' => $rate];
            })->values();

            return [
                'summary' => [
                    'ok' => $ok,
                    'ng' => $ng,
                    'contract_rate' => $contractRate,
                ],
                'ranking' => $ranking,
                'trend' => $trend,
            ];
        } catch (\Throwable $e) {
            Log::error('SalesService.summary failed', ['error' => $e->getMessage()]);
            return [
                'summary' => ['ok' => 0, 'ng' => 0, 'contract_rate' => 0.0],
                'ranking' => collect(),
                'trend' => collect(),
            ];
        }
    }

    /**
     * @return array{ok:int,ng:int,contract_rate:float}
     */
    public function personalSummary(User $actor): array
    {
        try {
            $all = $this->summary();
            $ranking = $all['ranking'] ?? collect();

            $match = $ranking->first(fn (array $r) => ($r['name'] ?? '') === ($actor->name ?? ''));

            if (is_array($match)) {
                $ok = (int) ($match['ok'] ?? 0);
                $ng = (int) ($match['ng'] ?? 0);
            } else {
                $seed = abs(crc32((string) ($actor->id ?? '0')));
                $ok = ($seed % 20) + 5;
                $ng = (($seed >> 4) % 15) + 3;
            }

            $rate = ($ok + $ng) === 0 ? 0.0 : round(($ok / ($ok + $ng)) * 100, 1);

            return ['ok' => $ok, 'ng' => $ng, 'contract_rate' => $rate];
        } catch (\Throwable $e) {
            Log::error('SalesService.personalSummary failed', ['error' => $e->getMessage()]);
            return ['ok' => 0, 'ng' => 0, 'contract_rate' => 0.0];
        }
    }
}

