<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('to_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('from_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 500);
            $table->string('requester', 255)->default('');
            $table->string('priority', 32)->default('normal');
            $table->string('status', 32)->default('pending');
            $table->date('due_date')->nullable();
            $table->text('body')->nullable();
            $table->boolean('chat_sent')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['to_user_id', 'status']);
            $table->index(['from_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_requests');
    }
};
