<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('integration', 30);
            $table->string('event_type', 60);
            $table->string('status', 20);
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->json('request_payload')->nullable();
            $table->longText('response_body')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('related_type')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['integration', 'event_type', 'created_at']);
            $table->index(['actor_id', 'created_at']);
            $table->index(['related_type', 'related_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};

