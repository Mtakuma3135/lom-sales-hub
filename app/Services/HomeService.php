<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class HomeService
{
    public function __construct(
        private NoticeService $noticeService,
        private LunchBreakService $lunchBreakService,
        private SalesService $salesService,
        private TaskRequestService $taskRequestService,
    ) {}

    /**
     * ホーム画面用データ（Inertia Props 組み立て元）
     *
     * @return array{
     *     notices: Collection<int, \App\Models\Notice>,
     *     lunchBreaks: \Illuminate\Support\Collection<int, array{start_time:string,end_time:string,capacity:int,reservations:\Illuminate\Support\Collection<int,\App\Models\LunchBreak>}>,
     *     lunchDate: string,
     *     kpi: array{summary:array{ok:int,ng:int,contract_rate:float},ranking:\Illuminate\Support\Collection<int,mixed>,trend:\Illuminate\Support\Collection<int,mixed>}
     * }
     */
    public function dashboard(User $actor): array
    {
        $date = now()->toDateString();

        $notices = $this->noticeService->indexFor($actor)->values();

        $slots = $this->lunchBreakService->index($date);

        $kpi = $this->salesService->summary();
        $personalKpi = $this->salesService->personalSummary($actor);

        $tasks = $this->taskRequestService->indexActiveForHome($actor);

        return [
            'notices' => $notices,
            'lunchBreaks' => $slots,
            'lunchDate' => $date,
            'kpi' => $kpi,
            'personalKpi' => $personalKpi,
            'tasks' => $tasks,
        ];
    }
}
