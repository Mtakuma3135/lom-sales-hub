<?php

/**
 * Web の indexFor と API の一覧が同一クエリ基盤（TaskRequestService::visibleQueryFor）＋
 * TaskRequestIndexFilter で管理者に「全件」、一般に受信トレイ分割を揃える。
 */

use App\Models\TaskRequest;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('API task-requests: admin receives all tasks not only inbox slice', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $u1 = User::factory()->create(['role' => 'general']);
    $u2 = User::factory()->create(['role' => 'general']);

    TaskRequest::query()->create([
        'from_user_id' => $u1->id,
        'to_user_id' => $u2->id,
        'title' => 'A',
        'requester' => 'U1',
        'priority' => 'normal',
        'status' => 'pending',
        'due_date' => now()->addDay(),
        'body' => '',
        'chat_sent' => false,
    ]);
    TaskRequest::query()->create([
        'from_user_id' => $u2->id,
        'to_user_id' => $u1->id,
        'title' => 'B',
        'requester' => 'U2',
        'priority' => 'normal',
        'status' => 'pending',
        'due_date' => now()->addDay(),
        'body' => '',
        'chat_sent' => false,
    ]);

    Sanctum::actingAs($admin);

    $json = $this->getJson('/api/task-requests')->assertOk()->json('data');
    expect($json)->toHaveCount(2);
});

test('API task-requests: general default type=received only shows tasks assigned to them', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $u1 = User::factory()->create(['role' => 'general']);
    $u2 = User::factory()->create(['role' => 'general']);

    TaskRequest::query()->create([
        'from_user_id' => $u1->id,
        'to_user_id' => $u2->id,
        'title' => 'To U2',
        'requester' => 'U1',
        'priority' => 'normal',
        'status' => 'pending',
        'due_date' => now()->addDay(),
        'body' => '',
        'chat_sent' => false,
    ]);

    Sanctum::actingAs($u1);
    expect($this->getJson('/api/task-requests')->json('data'))->toHaveCount(0);

    Sanctum::actingAs($u2);
    expect($this->getJson('/api/task-requests')->json('data'))->toHaveCount(1);

    Sanctum::actingAs($admin);
    expect($this->getJson('/api/task-requests')->json('data'))->toHaveCount(1);
});
