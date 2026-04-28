<?php

use App\Models\User;

test('general user is forbidden from admin pages', function () {
    $general = User::factory()->create([
        'role' => 'general',
    ]);

    $this->actingAs($general)->get('/portal/admin/users')->assertForbidden();
    $this->actingAs($general)->get('/portal/csv')->assertForbidden();
    $this->actingAs($general)->get('/portal/credentials')->assertForbidden();
});

test('admin can access admin pages', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)->get('/portal/admin/users')->assertOk();
    $this->actingAs($admin)->get('/portal/csv')->assertOk();
    $this->actingAs($admin)->get('/portal/credentials')->assertOk();
});

