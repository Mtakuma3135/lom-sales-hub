<?php

namespace App\Services;

use App\Models\Credential;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class CredentialService
{
    public function __construct(
        private readonly GasWebhookService $gasWebhook,
    ) {}

    /**
     * @return Collection<int, Credential>
     */
    public function index(): Collection
    {
        try {
            $items = Credential::query()
                ->where('visible_on_credentials_page', true)
                ->orderBy('id')
                ->get();

            return $this->withSampleRows($items, 10);
        } catch (\Throwable $e) {
            Log::error('CredentialService.index failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /**
     * DBが少ない時に「表示確認用」ダミーを足す（非productionのみ）
     *
     * @param  Collection<int, Credential>  $items
     * @return Collection<int, Credential>
     */
    private function withSampleRows(Collection $items, int $minCount): Collection
    {
        if ((string) config('app.env') === 'production') {
            return $items;
        }
        if ($items->count() >= $minCount) {
            return $items;
        }

        $need = $minCount - $items->count();
        $now = now();

        $samples = collect();
        for ($i = 1; $i <= $need; $i++) {
            $id = 900000 + $i;
            $c = new Credential();
            $c->id = $id;
            $c->label = "サンプルサービス {$i}";
            $c->login_id = "sample{$i}@example.com";
            $c->value = "Passw0rd!{$i}";
            $c->is_password = true;
            $c->visible_on_credentials_page = true;
            $c->setAttribute('is_mock', true);
            $c->updated_at = $now;
            $samples->push($c);
        }

        return $items->concat($samples)->values();
    }

    /**
     * 管理画面などから明示的に GAS 取り込み（一覧では呼ばない）
     */
    public function importFromGas(): void
    {
        try {
            $this->tryImportFromGas();
        } catch (\Throwable $e) {
            Log::warning('CredentialService.importFromGas failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * @return array{credential: Credential, gas_synced: ?bool, gas_queued: bool}
     */
    public function update(int $id, string $loginId, string $passwordPlain, string $updatedAt): array
    {
        try {
            $credential = Credential::query()->findOrFail($id);

            if ($credential->updated_at === null || $credential->updated_at->format('Y-m-d H:i:s') !== $updatedAt) {
                abort(409, '他のユーザーによって更新されました。');
            }

            $credential->login_id = $loginId;
            $credential->value = $passwordPlain;
            $credential->save();
            $credential->refresh();

            $pushId = (int) $credential->id;
            dispatch(function () use ($pushId): void {
                $row = Credential::query()->find($pushId);
                if ($row === null) {
                    return;
                }
                app(self::class)->pushCredentialRowToGas($row);
            })->afterResponse();

            return [
                'credential' => $credential,
                'gas_synced' => null,
                'gas_queued' => true,
            ];
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('CredentialService.update failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    private function tryImportFromGas(): void
    {
        $json = $this->gasWebhook->pullCredentialsJson();
        if (! is_array($json)) {
            return;
        }

        $rows = $json['rows'] ?? $json['credentials'] ?? $json['data'] ?? null;
        if (! is_array($rows)) {
            return;
        }

        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }
            $label = $row['service_name'] ?? $row['label'] ?? null;
            if (! is_string($label) || $label === '') {
                continue;
            }

            Credential::query()->updateOrCreate(
                ['label' => $label],
                [
                    'login_id' => (string) ($row['login_id'] ?? ''),
                    'value' => (string) ($row['password'] ?? $row['value'] ?? ''),
                    'is_password' => (bool) ($row['is_password'] ?? true),
                    'visible_on_credentials_page' => array_key_exists('visible', $row)
                        ? (bool) $row['visible']
                        : (bool) ($row['visible_on_credentials_page'] ?? true),
                ],
            );
        }
    }

    public function pushCredentialRowToGas(Credential $credential): bool
    {
        $base = trim((string) config('services.gas.credentials_url', ''));
        if ($base === '') {
            $base = trim((string) config('services.gas.dummy_url', ''));
        }
        if ($base === '') {
            return false;
        }

        $payload = [
            'event' => 'credentials_update',
            'credential_id' => (int) $credential->id,
            'service_name' => (string) $credential->label,
            'login_id' => (string) ($credential->login_id ?? ''),
            'password' => (string) $credential->value,
            'is_password' => (bool) $credential->is_password,
            'timestamp' => now()->timestamp,
            'sent_at' => now()->toISOString(),
        ];

        $status = $this->gasWebhook->post(
            $payload,
            'credentials.update',
            Credential::class,
            (int) $credential->id,
            false,
            $base,
        );

        return $status === 'success';
    }
}
