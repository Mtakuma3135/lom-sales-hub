<?php

namespace App\Services;

use App\Models\SalesRecord;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SalesService
{
    private const EMPTY_CONTRACT_MESSAGE = '今月はまだ契約がありません';

    /**
     * @return array{0: string, 1: string}
     */
    private function monthDateBounds(): array
    {
        $month = CarbonImmutable::now(config('app.timezone'))->startOfMonth();

        return [$month->toDateString(), $month->endOfMonth()->toDateString()];
    }

    /**
     * @return array{summary: array{ok:int, ng:int, contract_rate: float, contract_message: ?string}, ranking: Collection<int, array{rank:int, name:string, ok:int, ng:int, rate:float}>, trend: Collection<int, array{label:string, ok:int, ng:int, rate:float}>}
     */
    public function summary(): array
    {
        try {
            [$from, $to] = $this->monthDateBounds();

            $ok = (int) SalesRecord::query()->whereBetween('date', [$from, $to])->where('status', 'ok')->count();
            $ng = (int) SalesRecord::query()->whereBetween('date', [$from, $to])->where('status', 'ng')->count();
            $total = $ok + $ng;
            $contractRate = $total === 0 ? 0.0 : round(($ok / $total) * 100, 1);

            return [
                'summary' => [
                    'ok' => $ok,
                    'ng' => $ng,
                    'contract_rate' => $contractRate,
                    'contract_message' => $total === 0 ? self::EMPTY_CONTRACT_MESSAGE : null,
                ],
                'ranking' => $this->rankingForMonth($from, $to),
                'trend' => $this->trendWeeksForMonth($from, $to),
            ];
        } catch (\Throwable $e) {
            Log::error('SalesService.summary failed', ['error' => $e->getMessage()]);

            return [
                'summary' => [
                    'ok' => 0,
                    'ng' => 0,
                    'contract_rate' => 0.0,
                    'contract_message' => self::EMPTY_CONTRACT_MESSAGE,
                ],
                'ranking' => collect(),
                'trend' => collect(),
            ];
        }
    }

    /**
     * @return array{ok:int, ng:int, contract_rate:float, contract_message: ?string}
     */
    public function personalSummary(User $actor): array
    {
        try {
            [$from, $to] = $this->monthDateBounds();
            $name = trim((string) ($actor->name ?? ''));

            if ($name === '') {
                return ['ok' => 0, 'ng' => 0, 'contract_rate' => 0.0, 'contract_message' => self::EMPTY_CONTRACT_MESSAGE];
            }

            $ok = (int) SalesRecord::query()
                ->whereBetween('date', [$from, $to])
                ->where('status', 'ok')
                ->where('staff_name', $name)
                ->count();

            $ng = (int) SalesRecord::query()
                ->whereBetween('date', [$from, $to])
                ->where('status', 'ng')
                ->where('staff_name', $name)
                ->count();

            $total = $ok + $ng;
            $rate = $total === 0 ? 0.0 : round(($ok / $total) * 100, 1);

            return [
                'ok' => $ok,
                'ng' => $ng,
                'contract_rate' => $rate,
                'contract_message' => $total === 0 ? self::EMPTY_CONTRACT_MESSAGE : null,
            ];
        } catch (\Throwable $e) {
            Log::error('SalesService.personalSummary failed', ['error' => $e->getMessage()]);

            return ['ok' => 0, 'ng' => 0, 'contract_rate' => 0.0, 'contract_message' => self::EMPTY_CONTRACT_MESSAGE];
        }
    }

    /**
     * @return Collection<int, array{rank:int, name:string, ok:int, ng:int, rate:float}>
     */
    private function rankingForMonth(string $from, string $to): Collection
    {
        $rows = SalesRecord::query()
            ->whereBetween('date', [$from, $to])
            ->where('staff_name', '!=', '')
            ->selectRaw(
                'staff_name as name, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as ok, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as ng',
                ['ok', 'ng']
            )
            ->groupBy('staff_name')
            ->get();

        return $rows
            ->map(function ($row) {
                $ok = (int) $row->ok;
                $ng = (int) $row->ng;
                $den = $ok + $ng;
                $rate = $den === 0 ? 0.0 : round(($ok / $den) * 100, 1);

                return [
                    'name' => (string) $row->name,
                    'ok' => $ok,
                    'ng' => $ng,
                    'rate' => $rate,
                ];
            })
            ->sortByDesc(fn (array $r) => [$r['rate'], $r['ok']])
            ->values()
            ->map(fn (array $r, int $idx) => $r + ['rank' => $idx + 1]);
    }

    /**
     * @return Collection<int, array{label:string, ok:int, ng:int, rate:float}>
     */
    private function trendWeeksForMonth(string $from, string $to): Collection
    {
        $records = SalesRecord::query()
            ->whereBetween('date', [$from, $to])
            ->get(['date', 'status']);

        $buckets = [];
        foreach ($records as $rec) {
            $d = CarbonImmutable::parse($rec->date)->timezone(config('app.timezone'));
            $weekNum = (int) min(5, max(1, (int) ceil($d->day / 7)));
            $label = '第'.$weekNum.'週';
            if (! isset($buckets[$label])) {
                $buckets[$label] = ['ok' => 0, 'ng' => 0];
            }
            if ($rec->status === 'ng') {
                $buckets[$label]['ng']++;
            } else {
                $buckets[$label]['ok']++;
            }
        }

        $ordered = ['第1週', '第2週', '第3週', '第4週', '第5週'];

        return collect($ordered)
            ->filter(fn (string $label) => isset($buckets[$label]))
            ->map(function (string $label) use ($buckets) {
                $ok = (int) ($buckets[$label]['ok'] ?? 0);
                $ng = (int) ($buckets[$label]['ng'] ?? 0);
                $den = $ok + $ng;
                $rate = $den === 0 ? 0.0 : round(($ok / $den) * 100, 1);

                return ['label' => $label, 'ok' => $ok, 'ng' => $ng, 'rate' => $rate];
            })
            ->values();
    }
}
