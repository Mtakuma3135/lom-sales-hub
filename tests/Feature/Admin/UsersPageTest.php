<?php

use App\Models\User;

test('admin can access users page', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->get('/portal/admin/users');

    $response->assertOk();
});

test('general user can access users page (temporary during development)', function () {
    $general = User::factory()->create([
        'role' => 'general',
    ]);

    $response = $this->actingAs($general)->get('/portal/admin/users');

    $response->assertForbidden();
});

