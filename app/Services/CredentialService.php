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
            $this->tryImportFromGas();

            return Credential::query()
                ->where('visible_on_credentials_page', true)
                ->orderBy('id')
                ->get();
        } catch (\Throwable $e) {
            Log::error('CredentialService.index failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /**
     * @return array{credential: Credential, gas_synced: bool}
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

            $gasSynced = $this->pushCredentialRowToGas($credential);

            return [
                'credential' => $credential,
                'gas_synced' => $gasSynced,
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

    private function pushCredentialRowToGas(Credential $credential): bool
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
