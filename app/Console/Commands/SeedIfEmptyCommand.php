<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SeedIfEmptyCommand extends Command
{
    protected $signature = 'app:seed-if-empty {--ensure-demo-admin : Always upsert the portfolio demo admin account.}';

    protected $description = 'Seed demo data only when the users table exists and has no records.';

    public function handle(): int
    {
        if (! Schema::hasTable('users')) {
            $this->warn('Skipped seeding because the users table does not exist.');
            return self::SUCCESS;
        }

        if ($this->option('ensure-demo-admin')) {
            $this->ensureDemoAdmin();
        }

        if (User::query()->exists()) {
            $this->info('Skipped seeding because users already exist.');
            return self::SUCCESS;
        }

        $this->info('No users found. Running DatabaseSeeder once.');
        $this->call('db:seed', ['--force' => true]);

        return self::SUCCESS;
    }

    private function ensureDemoAdmin(): void
    {
        User::query()->updateOrCreate(
            ['employee_code' => '12345'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ],
        );

        $this->info('Ensured demo admin account: 12345 / password.');
    }
}
