<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discord_notification_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('event_type', 50);
            $table->json('payload');
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->longText('response_body')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedBigInteger('triggered_by')->nullable();
            $table->timestamps();

            $table->index(['event_type', 'created_at']);
            $table->index(['triggered_by', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discord_notification_logs');
    }
};