<?php

use App\Models\LunchBreak;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lunch_breaks', function (Blueprint $table): void {
            $table->unsignedTinyInteger('lane')->default(1)->after('end_time');
        });

        $rows = LunchBreak::query()
            ->orderBy('date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        $grouped = $rows->groupBy(function (LunchBreak $r) {
            return $r->date->format('Y-m-d').'|'.substr((string) $r->start_time, 0, 5);
        });

        foreach ($grouped as $group) {
            foreach ($group->values() as $i => $r) {
                $r->lane = ($i % 3) + 1;
                $r->save();
            }
        }
    }

    public function down(): void
    {
        Schema::table('lunch_breaks', function (Blueprint $table): void {
            $table->dropColumn('lane');
        });
    }
};
