<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SalesService
{
    private function seededInt(int &$seed, int $min, int $max): int
    {
        // xorshift32 (deterministic, fast)
        $seed ^= ($seed << 13) & 0xFFFFFFFF;
        $seed ^= ($seed >> 17) & 0xFFFFFFFF;
        $seed ^= ($seed << 5) & 0xFFFFFFFF;
        $seed &= 0x7FFFFFFF;

        if ($max <= $min) {
            return $min;
        }
        return $min + ($seed % (($max - $min) + 1));
    }

    /**
     * @return array{summary:array{ok:int,ng:int,contract_rate:float},ranking:\Illuminate\Support\Collection<int,array{rank:int,name:string,ok:int,ng:int,rate:float}>,trend:\Illuminate\Support\Collection<int,array{label:string,ok:int,ng:int,rate:float}>}
     */
    private function simulatedSummary(CarbonImmutable $month): array
    {
        // Stable within the same month (changes month-to-month).
        $seed = abs(crc32($month->format('Y-m')));

        // Weekly-ish trend (W1..W5) for the month.
        $weeks = [];
        $cursor = $month->startOfMonth();
        $end = $month->endOfMonth();
        $w = 1;
        while ($cursor->lte($end)) {
            $weeks[] = "W{$w}";
            $cursor = $cursor->addDays(7);
            $w++;
            if ($w > 5) {
                break;
            }
        }

        $trend = collect($weeks)->map(function (string $label) use (&$seed) {
            // Volume + quality fluctuate per week.
            $ok = $this->seededInt($seed, 18, 55);
            $ng = $this->seededInt($seed, 6, 32);
            $rate = ($ok + $ng) === 0 ? 0.0 : round(($ok / ($ok + $ng)) * 100, 1);
            return ['label' => $label, 'ok' => $ok, 'ng' => $ng, 'rate' => $rate];
        })->values();

        $okTotal = (int) $trend->sum('ok');
        $ngTotal = (int) $trend->sum('ng');
        $contractRate = ($okTotal + $ngTotal) === 0 ? 0.0 : round(($okTotal / ($okTotal + $ngTotal)) * 100, 1);

        // Ranking (keep familiar sample names, but numbers fluctuate per month)
        $names = [
            '山田太郎',
            '佐藤花子',
            '鈴木一郎',
            '高橋次郎',
            '田中美咲',
            '伊藤健',
            '渡辺さくら',
            '小林大輔',
        ];

        $ranking = collect($names)->map(function (string $name) use (&$seed) {
            $ok = $this->seededInt($seed, 6, 40);
            $ng = $this->seededInt($seed, 3, 22);
            $rate = ($ok + $ng) === 0 ? 0.0 : round(($ok / ($ok + $ng)) * 100, 1);
            return ['name' => $name, 'ok' => $ok, 'ng' => $ng, 'rate' => $rate];
        })
            ->sortByDesc(fn (array $r) => [$r['rate'], $r['ok']])
            ->values()
            ->map(function (array $r, int $idx) {
                return $r + ['rank' => $idx + 1];
            })
            ->values();

        return [
            'summary' => [
                'ok' => $okTotal,
                'ng' => $ngTotal,
                'contract_rate' => $contractRate,
            ],
            'ranking' => $ranking,
            'trend' => $trend,
        ];
    }

    /**
     * @return array{summary:array{ok:int,ng:int,contract_rate:float},ranking:\Illuminate\Support\Collection<int,array{rank:int,name:string,ok:int,ng:int,rate:float}>,trend:\Illuminate\Support\Collection<int,array{label:string,ok:int,ng:int,rate:float}>}
     */
    public function summary(): array
    {
        try {
            return $this->simulatedSummary(CarbonImmutable::now()->startOfMonth());
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

