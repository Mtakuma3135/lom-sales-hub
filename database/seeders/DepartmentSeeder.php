<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'sales-1', 'name' => '営業1課'],
            ['code' => 'sales-2', 'name' => '営業2課'],
            ['code' => 'cs', 'name' => 'CS'],
            ['code' => 'ops', 'name' => '業務推進'],
        ];

        foreach ($items as $row) {
            Department::query()->updateOrCreate(
                ['code' => $row['code']],
                ['name' => $row['name']]
            );
        }
    }
}

