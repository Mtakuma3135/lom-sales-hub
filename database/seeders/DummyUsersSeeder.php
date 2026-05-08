<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DummyUsersSeeder extends Seeder
{
    public function run(): void
    {
        $base = 20001;
        $count = 20;
        $now = now();

        for ($i = 0; $i < $count; $i++) {
            $employeeCode = (string) ($base + $i);

            User::query()->updateOrCreate(
                ['employee_code' => $employeeCode],
                [
                    'name' => "テストユーザー{$employeeCode}",
                    'email' => "user{$employeeCode}@example.com",
                    'password' => Hash::make('password'),
                    'role' => 'general',
                    'is_active' => true,
                    'email_verified_at' => $now,
                ]
            );
        }
    }
}

