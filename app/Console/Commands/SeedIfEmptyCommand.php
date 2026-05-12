<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class SeedIfEmptyCommand extends Command
{
    protected $signature = 'app:seed-if-empty';

    protected $description = 'Seed demo data only when the users table exists and has no records.';

    public function handle(): int
    {
        if (! Schema::hasTable('users')) {
            $this->warn('Skipped seeding because the users table does not exist.');
            return self::SUCCESS;
        }

        if (User::query()->exists()) {
            $this->info('Skipped seeding because users already exist.');
            return self::SUCCESS;
        }

        $this->info('No users found. Running DatabaseSeeder once.');
        $this->call('db:seed', ['--force' => true]);

        return self::SUCCESS;
    }
}
