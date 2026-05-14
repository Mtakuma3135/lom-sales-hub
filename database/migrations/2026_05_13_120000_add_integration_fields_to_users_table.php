<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->text('kot_personal_api_token')->nullable()->after('remember_token');
            $table->text('personal_discord_webhook_url')->nullable()->after('kot_personal_api_token');
            $table->text('extra_integrations')->nullable()->after('personal_discord_webhook_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['kot_personal_api_token', 'personal_discord_webhook_url', 'extra_integrations']);
        });
    }
};
