<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lunch_break_actives', function (Blueprint $table): void {
            $table->id();
            $table->date('date');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('lane')->nullable();
            $table->string('planned_start_time', 5)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['date', 'user_id']);
            $table->index(['date', 'lane']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lunch_break_actives');
    }
};

