<?php

namespace Database\Seeders;

use App\Models\DailyTaskEntry;
use App\Models\DailyTaskTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class DailyTaskSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('employee_code', '12345')->first();
        if (! $admin) {
            return;
        }

        $titles = [
            '朝会のアジェンダ確認',
            '昨日の録音サンプルを1本レビュー',
            '新規トークスクリプトの差分チェック',
            '周知事項の確認（PIN含む）',
        ];

        $templates = collect($titles)->map(function (string $title) use ($admin) {
            return DailyTaskTemplate::query()->updateOrCreate(
                ['user_id' => (int) $admin->id, 'title' => $title],
                [],
            );
        })->values();

        $today = now()->toDateString();
        $statuses = ['pending', 'in_progress', 'completed', 'completed'];

        foreach ($templates as $i => $t) {
            DailyTaskEntry::query()->updateOrCreate(
                [
                    'user_id' => (int) $admin->id,
                    'daily_task_template_id' => (int) $t->id,
                    'work_date' => $today,
                ],
                ['status' => $statuses[$i % count($statuses)]],
            );
        }
    }
}
