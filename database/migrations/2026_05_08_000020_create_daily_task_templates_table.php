<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_task_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 500);
            $table->timestamps();
        });

        Schema::create('daily_task_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('daily_task_template_id')->constrained('daily_task_templates')->cascadeOnDelete();
            $table->date('work_date');
            $table->string('status', 32)->default('pending');
            $table->timestamps();

            $table->unique(['user_id', 'daily_task_template_id', 'work_date'], 'daily_task_entries_user_template_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_task_entries');
        Schema::dropIfExists('daily_task_templates');
    }
};
