<?php

use App\Services\GasWebhookService;
use Illuminate\Support\Facades\Http;

test('GAS outbound is refused when signing secret missing and lom rejects unsigned', function () {
    Http::fake();

    config([
        'lom.gas_reject_unsigned_outbound' => true,
        'services.gas.dummy_url' => 'https://gas.example.test/webhook',
        'services.gas.signing_secret' => '',
    ]);

    $service = app(GasWebhookService::class);
    $result = $service->post(['ping' => true], 'test_event');

    expect($result)->toBe('failed');
    Http::assertNothingSent();
});

test('GAS pullCredentialsJson returns null when signing secret missing and reject enabled', function () {
    Http::fake();

    config([
        'lom.gas_reject_unsigned_outbound' => true,
        'services.gas.credentials_url' => 'https://gas.example.test/credentials',
        'services.gas.signing_secret' => '',
    ]);

    $service = app(GasWebhookService::class);
    expect($service->pullCredentialsJson())->toBeNull();
    Http::assertNothingSent();
});
