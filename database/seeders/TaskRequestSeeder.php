<?php

namespace Database\Seeders;

use App\Models\TaskRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskRequestSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('employee_code', '12345')->first();
        $staff = User::query()->where('employee_code', '20001')->first();

        if (! $admin || ! $staff) {
            return;
        }

        $rows = [
            [
                'title' => 'トークスクリプトの更新依頼（本人確認）',
                'requester' => '品質管理',
                'priority' => 'urgent',
                'status' => 'pending',
                'due_date' => now()->addDays(2)->toDateString(),
                'body' => '録音サンプル共有済み。修正期限は今週中。',
                'to_user_id' => (int) $admin->id,
                'from_user_id' => (int) $staff->id,
                'chat_sent' => false,
            ],
            [
                'title' => '商材資料の差し替え（Driveリンク更新）',
                'requester' => '商品企画',
                'priority' => 'important',
                'status' => 'in_progress',
                'due_date' => now()->addDays(5)->toDateString(),
                'body' => '新PDFは共有フォルダにあります。URL差し替えをお願いします。',
                'to_user_id' => (int) $admin->id,
                'from_user_id' => (int) $staff->id,
                'chat_sent' => false,
            ],
            [
                'title' => '周知事項のPIN運用ルール策定',
                'requester' => '総務',
                'priority' => 'important',
                'status' => 'completed',
                'due_date' => now()->subDays(1)->toDateString(),
                'body' => '草案は別紙参照。次回MTGで確定します。',
                'to_user_id' => (int) $admin->id,
                'from_user_id' => (int) $staff->id,
                'chat_sent' => true,
            ],
        ];

        foreach ($rows as $row) {
            TaskRequest::query()->updateOrCreate(
                [
                    'title' => $row['title'],
                    'to_user_id' => $row['to_user_id'],
                    'from_user_id' => $row['from_user_id'],
                ],
                $row,
            );
        }
    }
}
