<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `task_requests.deleted_at` が無い DB（マイグレーション未適用）を修復する。
 */
class EnsureTaskRequestsSoftDeletesCommand extends Command
{
    protected $signature = 'db:ensure-task-requests-soft-deletes';

    protected $description = 'Add task_requests.deleted_at if missing (soft deletes)';

    public function handle(): int
    {
        if (! Schema::hasTable('task_requests')) {
            $this->error('Table task_requests does not exist. Run php artisan migrate first.');

            return self::FAILURE;
        }

        if (Schema::hasColumn('task_requests', 'deleted_at')) {
            $this->info('Column task_requests.deleted_at already exists.');

            return self::SUCCESS;
        }

        Schema::table('task_requests', function (Blueprint $table): void {
            $table->softDeletes();
        });

        $this->info('Added task_requests.deleted_at.');

        return self::SUCCESS;
    }
}
