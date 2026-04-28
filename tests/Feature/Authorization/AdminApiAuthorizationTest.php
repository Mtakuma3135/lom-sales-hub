<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;

test('general user is forbidden from admin API endpoints', function () {
    $general = User::factory()->create([
        'role' => 'general',
    ]);

    Sanctum::actingAs($general);

    $this->getJson('/api/users')->assertForbidden();
    $this->getJson('/api/credentials')->assertForbidden();
    $this->getJson('/api/csv/uploads')->assertForbidden();
    $this->postJson('/api/csv/upload', [
        'file' => UploadedFile::fake()->create('sales.csv', 2, 'text/csv'),
    ])->assertForbidden();
});

test('admin can access admin API endpoints', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    Sanctum::actingAs($admin);

    $this->getJson('/api/users')->assertOk();
    $this->getJson('/api/credentials')->assertOk();
    $this->getJson('/api/csv/uploads')->assertOk();
});

