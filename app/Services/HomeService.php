<?php

namespace App\Services;

use App\Models\LunchBreak;
use App\Models\Notice;
use App\Models\User;
use Illuminate\Support\Collection;

class HomeService
{
    public function __construct(
        private NoticeService $noticeService,
        private LunchBreakService $lunchBreakService,
        private SalesService $salesService,
        private TaskRequestService $taskRequestService,
        private DailyTaskService $dailyTaskService,
    ) {}

    /**
     * ホーム画面用データ（Inertia Props 組み立て元）
     *
     * @return array{
     *     notices: Collection<int, Notice>,
     *     lunchBreaks: Collection<int, array{start_time:string,end_time:string,capacity:int,reservations:Collection<int,LunchBreak>}>,
     *     lunchDate: string,
     *     kpi: array{summary:array{ok:int,ng:int,contract_rate:float},ranking:Collection<int,mixed>,trend:Collection<int,mixed>}
     * }
     */
    public function dashboard(User $actor): array
    {
        $date = now()->toDateString();

        $notices = $this->noticeService->indexFor($actor)->values();

        $slots = $this->lunchBreakService->index($date);

        $kpi = $this->salesService->summary();
        $personalKpi = $this->salesService->personalSummary($actor);

        $tasks = $this->taskRequestService->indexFor($actor)->take(50)->values();
        $dailyTasks = $this->dailyTaskService->todayTasksFor($actor);

        return [
            'notices' => $notices,
            'lunchBreaks' => $slots,
            'lunchDate' => $date,
            'kpi' => $kpi,
            'personalKpi' => $personalKpi,
            'tasks' => $tasks,
            'dailyTasks' => $dailyTasks,
        ];
    }
}
