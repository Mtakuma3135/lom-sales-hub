<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_records', function (Blueprint $table): void {
            $table->unsignedBigInteger('csv_upload_id')->nullable()->after('id');

            // CSV列（最小セット）
            $table->string('store_name')->default('')->after('staff_name');
            $table->unsignedInteger('sales_amount')->default(0)->after('store_name');
            $table->unsignedInteger('customer_count')->default(0)->after('sales_amount');

            $table->index(['csv_upload_id', 'date']);
            $table->foreign('csv_upload_id')->references('id')->on('csv_uploads')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sales_records', function (Blueprint $table): void {
            $table->dropForeign(['csv_upload_id']);
            $table->dropIndex(['csv_upload_id', 'date']);
            $table->dropColumn(['csv_upload_id', 'store_name', 'sales_amount', 'customer_count']);
        });
    }
};

