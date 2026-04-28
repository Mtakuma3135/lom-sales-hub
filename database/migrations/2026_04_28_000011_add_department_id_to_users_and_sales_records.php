<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->unsignedBigInteger('department_id')->nullable()->after('id');
            $table->index(['department_id']);
        });

        Schema::table('sales_records', function (Blueprint $table): void {
            $table->unsignedBigInteger('department_id')->nullable()->after('id');
            $table->index(['department_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['department_id']);
            $table->dropColumn(['department_id']);
        });

        Schema::table('sales_records', function (Blueprint $table): void {
            $table->dropIndex(['department_id', 'date']);
            $table->dropColumn(['department_id']);
        });
    }
};

