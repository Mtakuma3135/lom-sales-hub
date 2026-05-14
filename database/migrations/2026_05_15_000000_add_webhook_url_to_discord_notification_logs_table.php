<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discord_notification_logs', function (Blueprint $table): void {
            if (! Schema::hasColumn('discord_notification_logs', 'webhook_url')) {
                $table->text('webhook_url')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('discord_notification_logs', function (Blueprint $table): void {
            if (Schema::hasColumn('discord_notification_logs', 'webhook_url')) {
                $table->dropColumn('webhook_url');
            }
        });
    }
};
