<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

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

test('admin can deactivate another user via DELETE', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $target = User::factory()->create(['role' => 'general', 'is_active' => true]);

    $response = $this->actingAs($admin)->delete('/portal/admin/users/'.$target->id);

    $response->assertRedirect(route('admin.users.index'));
    expect($target->fresh()->is_active)->toBeFalse();
});

test('admin cannot deactivate self via DELETE', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->delete('/portal/admin/users/'.$admin->id);

    $response->assertRedirect(route('admin.users.index'));
    $response->assertSessionHas('error');
    expect((bool) $admin->fresh()->is_active)->toBeTrue();
});

test('admin can update user employee_code and password', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $target = User::factory()->create([
        'role' => 'general',
        'employee_code' => 'EMP9001',
        'password' => Hash::make('OldPass99!'),
    ]);

    $response = $this->actingAs($admin)->patch('/portal/admin/users/'.$target->id, [
        'name' => $target->name,
        'employee_code' => 'EMP9002',
        'email' => '',
        'password' => 'NewPass88!',
        'role' => 'general',
        'is_active' => true,
    ]);

    $response->assertRedirect(route('admin.users.index'));
    $target->refresh();
    expect($target->employee_code)->toBe('EMP9002');
    expect(Hash::check('NewPass88!', $target->password))->toBeTrue();
});
