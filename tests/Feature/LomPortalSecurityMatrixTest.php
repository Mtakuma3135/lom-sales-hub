<?php

/**
 * 指示書 §3.1（config/lom.php）の「コードで強制」と、§6.3 TaskRequest Gate の期待値を
 * Pest で表形式ドキュメント化する。個別ケースは test 名とコメントで追えるようにする。
 *
 * ┌────────────────────────────────────┬──────────────────────────────────────────────┐
 * │ §3.1 キー                          │ 本テストで検証する挙動                         │
 * ├────────────────────────────────────┼──────────────────────────────────────────────┤
 * │ registration_enabled               │ false 時 GET/POST /register → 404            │
 * │ kot_mock_endpoint_enabled          │ false 時 POST /portal/mock/kot/punch → 404   │
 * │ admin_allowed_ips（非空時）        │ admin の Web が許可 IP 外 → 403               │
 * │ enforce_admin_two_factor           │ true かつ admin 未完了 → /portal へ 302 誘導 │
 * │ csp_connect_src_extra              │ Web 応答に Content-Security-Policy ヘッダ     │
 * │ CSP + APP_DEBUG                    │ false 時は unsafe-eval / Vite 用 origin なし │
 * │ CSP + APP_DEBUG                    │ true 時は unsafe-eval と localhost:5173 等   │
 * └────────────────────────────────────┴──────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────┬──────────────┬────────────────────────────────────────┐
 * │ Gate                        │ 条件         │ 期待                                    │
 * ├─────────────────────────────┼──────────────┼────────────────────────────────────────┤
 * │ taskRequest.updateStatus    │ admin        │ allow                                   │
 * │ taskRequest.updateStatus    │ to_user      │ allow                                   │
 * │ taskRequest.updateStatus    │ from_user のみ │ deny（依頼元はステータス変更不可 §6.3） │
 * │ taskRequest.updateFields    │ to_user      │ allow                                   │
 * │ taskRequest.updateFields    │ from_user のみ │ deny                                   │
 * │ taskRequest.delete           │ from_user    │ allow                                   │
 * │ taskRequest.restore          │ to_user      │ allow                                   │
 * └─────────────────────────────┴──────────────┴────────────────────────────────────────┘
 */

use App\Models\TaskRequest;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

uses()->group('lom-security-doc');

test('§3.1 registration_enabled: disabled returns 404 for register routes', function () {
    config(['lom.registration_enabled' => false]);

    $this->get('/register')->assertNotFound();
    $this->post('/register', [])->assertNotFound();
});

test('§3.1 kot_mock_endpoint_enabled: disabled returns 404 for mock punch', function () {
    config(['lom.kot_mock_endpoint_enabled' => false]);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('portal.mock.kot.punch'), ['kind' => 'in', 'at' => now()->toISOString()])
        ->assertNotFound();
});

test('§3.1 admin_allowed_ips: non-matching IPv4 for admin yields 403', function () {
    config(['lom.admin_allowed_ips' => ['203.0.113.10']]);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->call('GET', '/portal', [], [], [], ['REMOTE_ADDR' => '198.51.100.1'])
        ->assertForbidden();
});

test('§3.1 admin_allowed_ips: matching IPv4 allows admin portal', function () {
    config(['lom.admin_allowed_ips' => ['203.0.113.10']]);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->call('GET', '/portal', [], [], [], ['REMOTE_ADDR' => '203.0.113.10'])
        ->assertOk();
});

test('§3.1 enforce_admin_two_factor: admin without TOTP is redirected from portal', function () {
    config(['lom.enforce_admin_two_factor' => true]);
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->get('/portal')
        ->assertRedirect(route('portal.two-factor.setup'));
});

test('§3.3 Sanctum idle minutes are exposed via config/lom.php', function () {
    config(['lom.sanctum_api_idle_minutes' => 42]);
    expect((int) config('lom.sanctum_api_idle_minutes'))->toBe(42);
});

test('§3.1 csp_connect_src_extra: portal response includes Content-Security-Policy', function () {
    config(['lom.csp_connect_src_extra' => ['https://example.com']]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/portal');
    $response->assertOk();
    $csp = (string) $response->headers->get('Content-Security-Policy');
    expect($csp)->toContain('connect-src');
    expect($csp)->toContain('https://example.com');
});

test('§3.1 CSP: APP_DEBUG=false omits unsafe-eval and Vite dev origins', function () {
    config([
        'app.debug' => false,
        'lom.csp_connect_src_extra' => [],
        'lom.csp_vite_dev_extra' => [],
    ]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/portal');
    $response->assertOk();
    $csp = (string) $response->headers->get('Content-Security-Policy');

    expect($csp)->not->toContain("'unsafe-eval'");
    expect($csp)->not->toContain('http://localhost:5173');
    expect($csp)->not->toContain('ws://127.0.0.1:5173');
    expect($csp)->toContain("script-src 'self' 'unsafe-inline'");
});

test('§3.1 CSP: APP_DEBUG=true adds unsafe-eval and localhost Vite script origins', function () {
    config([
        'app.debug' => true,
        'lom.csp_connect_src_extra' => [],
        'lom.csp_vite_dev_extra' => [],
    ]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/portal');
    $response->assertOk();
    $csp = (string) $response->headers->get('Content-Security-Policy');

    expect($csp)->toContain("'unsafe-eval'");
    expect($csp)->toContain('http://localhost:5173');
    expect($csp)->toContain('connect-src');
    expect($csp)->toContain('ws://localhost:5173');
});

test('§6.3 Gate taskRequest.updateStatus: admin and assignee allowed, requester denied', function () {
    $from = User::factory()->create(['role' => 'general']);
    $to = User::factory()->create(['role' => 'general']);
    $other = User::factory()->create(['role' => 'general']);
    $admin = User::factory()->create(['role' => 'admin']);

    $task = TaskRequest::query()->create([
        'from_user_id' => $from->id,
        'to_user_id' => $to->id,
        'title' => 'T',
        'requester' => 'R',
        'priority' => 'normal',
        'status' => 'pending',
        'due_date' => now()->addDay(),
        'body' => '',
        'chat_sent' => false,
    ]);

    expect(Gate::forUser($admin)->allows('taskRequest.updateStatus', $task))->toBeTrue();
    expect(Gate::forUser($to)->allows('taskRequest.updateStatus', $task))->toBeTrue();
    expect(Gate::forUser($from)->allows('taskRequest.updateStatus', $task))->toBeFalse();
    expect(Gate::forUser($other)->allows('taskRequest.updateStatus', $task))->toBeFalse();
});

test('§6.3 Gate taskRequest.updateFields: assignee and admin only', function () {
    $from = User::factory()->create(['role' => 'general']);
    $to = User::factory()->create(['role' => 'general']);
    $admin = User::factory()->create(['role' => 'admin']);

    $task = TaskRequest::query()->create([
        'from_user_id' => $from->id,
        'to_user_id' => $to->id,
        'title' => 'T',
        'requester' => 'R',
        'priority' => 'normal',
        'status' => 'pending',
        'due_date' => now()->addDay(),
        'body' => '',
        'chat_sent' => false,
    ]);

    expect(Gate::forUser($admin)->allows('taskRequest.updateFields', $task))->toBeTrue();
    expect(Gate::forUser($to)->allows('taskRequest.updateFields', $task))->toBeTrue();
    expect(Gate::forUser($from)->allows('taskRequest.updateFields', $task))->toBeFalse();
});

test('§6.3 Gate taskRequest.delete: from, to, or admin', function () {
    $from = User::factory()->create(['role' => 'general']);
    $to = User::factory()->create(['role' => 'general']);
    $admin = User::factory()->create(['role' => 'admin']);
    $other = User::factory()->create(['role' => 'general']);

    $task = TaskRequest::query()->create([
        'from_user_id' => $from->id,
        'to_user_id' => $to->id,
        'title' => 'T',
        'requester' => 'R',
        'priority' => 'normal',
        'status' => 'pending',
        'due_date' => now()->addDay(),
        'body' => '',
        'chat_sent' => false,
    ]);

    expect(Gate::forUser($admin)->allows('taskRequest.delete', $task))->toBeTrue();
    expect(Gate::forUser($from)->allows('taskRequest.delete', $task))->toBeTrue();
    expect(Gate::forUser($to)->allows('taskRequest.delete', $task))->toBeTrue();
    expect(Gate::forUser($other)->allows('taskRequest.delete', $task))->toBeFalse();
});
