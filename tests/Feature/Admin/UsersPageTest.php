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

test('admin user creation requires internal policy explanation confirmation', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->post('/portal/admin/users', [
        'name' => 'Policy Missing',
        'employee_code' => 'EMP7771',
        'password' => 'Str0ng!Test99',
        'role' => 'general',
    ]);

    $response->assertSessionHasErrors(['internal_policy_explained']);
    $this->assertDatabaseMissing('users', [
        'employee_code' => 'EMP7771',
    ]);
});

test('admin user creation stores internal policy explanation evidence', function () {
    config(['lom.internal_policy_version' => '2026-portfolio']);

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->post('/portal/admin/users', [
        'name' => 'Policy Confirmed',
        'employee_code' => 'EMP7772',
        'password' => 'Str0ng!Test99',
        'role' => 'general',
        'internal_policy_explained' => '1',
    ]);

    $response->assertRedirect(route('admin.users.index'));

    $created = User::query()
        ->where('employee_code', 'EMP7772')
        ->firstOrFail();

    expect($created->internal_policy_explained_at)->not->toBeNull();
    expect($created->internal_policy_version)->toBe('2026-portfolio');
});

