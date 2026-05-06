<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lunch_break_actives', function (Blueprint $table): void {
            if (! Schema::hasColumn('lunch_break_actives', 'finished_at')) {
                $table->timestamp('finished_at')->nullable()->after('started_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lunch_break_actives', function (Blueprint $table): void {
            if (Schema::hasColumn('lunch_break_actives', 'finished_at')) {
                $table->dropColumn('finished_at');
            }
        });
    }
};

