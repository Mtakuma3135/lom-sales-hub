<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_records', function (Blueprint $table): void {
            // CSV追跡（行単位）
            $table->unsignedInteger('csv_row_number')->nullable()->after('csv_upload_id');

            // 将来の列変更に備えてrawを保持（ヘッダ名→値）
            $table->json('raw')->nullable()->after('customer_count');

            // “よくある”列は先に置いておく（必要になれば後で厳密化）
            $table->string('product_name')->nullable()->after('raw');
            $table->string('contract_type')->nullable()->after('product_name');
            $table->string('channel')->nullable()->after('contract_type');
            $table->string('result')->nullable()->after('channel');

            $table->index(['csv_upload_id', 'csv_row_number']);
        });
    }

    public function down(): void
    {
        Schema::table('sales_records', function (Blueprint $table): void {
            $table->dropIndex(['csv_upload_id', 'csv_row_number']);
            $table->dropColumn(['csv_row_number', 'raw', 'product_name', 'contract_type', 'channel', 'result']);
        });
    }
};

