<?php

namespace Database\Seeders;

use App\Models\Credential;
use App\Models\CsvUpload;
use App\Models\Notice;
use App\Models\Product;
use App\Models\SalesRecord;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::query()->updateOrCreate(
            ['employee_code' => '12345'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ],
        );

        Product::query()->updateOrCreate(
            ['name' => '光回線プランA'],
            [
                'category' => '回線',
                'price' => 3980,
                'is_active' => true,
                'talk_script' => "【冒頭】\nお忙しいところ恐れ入ります。◯◯のご案内でお電話しました。\n\n【確認】\nご自宅のネット回線は現在どちらをご利用ですか？",
                'manual_url' => 'https://example.com/manual/hikari-a',
            ],
        );
        Product::query()->updateOrCreate(
            ['name' => 'モバイルWi-Fi（法人）'],
            [
                'category' => 'モバイル',
                'price' => 5480,
                'is_active' => true,
                'talk_script' => "【要点】\n・短期契約OK\n・法人割あり\n・即日発送",
                'manual_url' => 'https://example.com/manual/mobile-wifi',
            ],
        );
        Product::query()->updateOrCreate(
            ['name' => 'でんきセット割'],
            [
                'category' => 'オプション',
                'price' => 0,
                'is_active' => false,
                'talk_script' => "【注意】\n対象プラン/エリアに制限があります。",
                'manual_url' => 'https://example.com/manual/denki',
            ],
        );

        Notice::query()->updateOrCreate(
            ['title' => '【重要】4月度の営業目標について'],
            [
                'body' => '今月の重点は「初回トークの品質」です。録音チェックの基準を更新しました。',
                'is_pinned' => true,
                'published_at' => now()->subDays(10),
            ],
        );
        Notice::query()->updateOrCreate(
            ['title' => '新商材「光回線プラン」のトークスクリプト公開'],
            [
                'body' => 'ヒアリング質問とクロージング例を追加しました。',
                'is_pinned' => false,
                'published_at' => now()->subDays(8),
            ],
        );

        Credential::query()->updateOrCreate(
            ['label' => 'KING OF TIME API Token'],
            [
                'value' => 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                'is_password' => true,
            ],
        );
        Credential::query()->updateOrCreate(
            ['label' => 'Google Sheets GAS URL'],
            [
                'value' => 'https://script.google.com/macros/s/xxxxx/exec',
                'is_password' => false,
            ],
        );

        foreach ([
            ['田中 一郎', 'ok', '2026-04-01'],
            ['田中 一郎', 'ng', '2026-04-02'],
            ['佐藤 美咲', 'ok', '2026-04-03'],
            ['鈴木 健太', 'ok', '2026-04-03'],
            ['山田 浩二', 'ng', '2026-04-04'],
            ['高橋 次郎', 'ok', '2026-04-05'],
        ] as [$staffName, $status, $date]) {
            SalesRecord::query()->firstOrCreate([
                'staff_name' => $staffName,
                'status' => $status,
                'date' => $date,
            ]);
        }

        CsvUpload::query()->updateOrCreate(
            ['filename' => 'sales_2026-04.csv'],
            [
                'success_count' => 1212,
                'failed_count' => 28,
                'errors' => [
                    ['row' => 12, 'message' => 'employee_code が空です'],
                    ['row' => 45, 'message' => 'ok_at が日付形式ではありません'],
                ],
            ],
        );
    }
}
