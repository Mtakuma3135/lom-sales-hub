<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discord_notification_logs', function (Blueprint $table): void {
            $table->unsignedBigInteger('parent_id')->nullable()->after('id');
            $table->index(['parent_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('discord_notification_logs', function (Blueprint $table): void {
            $table->dropIndex(['parent_id', 'created_at']);
            $table->dropColumn('parent_id');
        });
    }
};

