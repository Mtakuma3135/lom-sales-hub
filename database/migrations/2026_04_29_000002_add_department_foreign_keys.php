<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table
                ->foreign('department_id')
                ->references('id')
                ->on('departments')
                ->nullOnDelete();
        });

        Schema::table('sales_records', function (Blueprint $table): void {
            $table
                ->foreign('department_id')
                ->references('id')
                ->on('departments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['department_id']);
        });

        Schema::table('sales_records', function (Blueprint $table): void {
            $table->dropForeign(['department_id']);
        });
    }
};

