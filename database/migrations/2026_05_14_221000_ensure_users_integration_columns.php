<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 連携設定用カラムが未作成の DB（マイグレ未実行・手戻り等）を救済する。
 * 2026_05_13_120000 と重複しても hasColumn でスキップする。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'kot_personal_api_token')) {
                $table->text('kot_personal_api_token')->nullable();
            }
            if (! Schema::hasColumn('users', 'personal_discord_webhook_url')) {
                $table->text('personal_discord_webhook_url')->nullable();
            }
            if (! Schema::hasColumn('users', 'extra_integrations')) {
                $table->text('extra_integrations')->nullable();
            }
        });
    }

    public function down(): void
    {
        // 2026_05_13_120000 と共有のため、rollback では列を落とさない
    }
};
