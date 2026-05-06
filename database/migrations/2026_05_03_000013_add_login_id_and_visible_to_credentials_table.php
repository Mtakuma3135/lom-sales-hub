<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credentials', function (Blueprint $table): void {
            $table->string('login_id')->nullable()->after('label');
            $table->boolean('visible_on_credentials_page')->default(true)->after('is_password');
        });

        DB::table('credentials')
            ->where('label', 'Google Sheets GAS URL')
            ->update(['visible_on_credentials_page' => false]);
    }

    public function down(): void
    {
        Schema::table('credentials', function (Blueprint $table): void {
            $table->dropColumn(['login_id', 'visible_on_credentials_page']);
        });
    }
};
