<?php

use App\Models\User;

test('general user can load portal pages', function () {
    $general = User::factory()->create([
        'role' => 'general',
    ]);

    $this->actingAs($general)->get('/portal')->assertOk();
    $this->actingAs($general)->get('/portal/lunch-breaks')->assertOk();
    $this->actingAs($general)->get('/portal/notices')->assertOk();
    $this->actingAs($general)->get('/portal/products')->assertOk();
    $this->actingAs($general)->get('/portal/sales/records')->assertOk();
    $this->actingAs($general)->get('/portal/tasks')->assertOk();
    $this->actingAs($general)->get('/portal/mypage')->assertOk();
});

