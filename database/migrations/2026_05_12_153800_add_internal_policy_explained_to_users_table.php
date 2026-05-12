<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('internal_policy_explained_at')->nullable()->after('is_active');
            $table->string('internal_policy_version')->nullable()->after('internal_policy_explained_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['internal_policy_explained_at', 'internal_policy_version']);
        });
    }
};
