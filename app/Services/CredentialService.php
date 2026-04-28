<?php

namespace App\Services;

use App\Models\Credential;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class CredentialService
{
    /**
     * @return Collection<int, Credential>
     */
    public function index(): Collection
    {
        try {
            return Credential::query()
                ->orderBy('id')
                ->get();
        } catch (\Throwable $e) {
            Log::error('CredentialService.index failed', ['error' => $e->getMessage()]);
            return collect();
        }
    }

    /**
     * @return array{id:int,label:string,value:string,is_password:bool,updated_at:string,gas_synced:bool}
     */
    public function update(int $id, string $value, string $updatedAt): array
    {
        try {
            $credential = Credential::query()->findOrFail($id);

            if ($credential->updated_at === null || $credential->updated_at->format('Y-m-d H:i:s') !== $updatedAt) {
                abort(409, '他のユーザーによって更新されました。');
            }

            $credential->value = $value;
            $credential->save();

            $gasSynced = $this->syncToGasDummy($id, $value);

            return [
                'id' => (int) $id,
                'label' => (string) ($credential->label ?? ''),
                'value' => $value,
                'is_password' => (bool) ($credential->is_password ?? false),
                'updated_at' => $credential->updated_at?->format('Y-m-d H:i:s') ?? now()->format('Y-m-d H:i:s'),
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

    private function syncToGasDummy(int $id, string $value): bool
    {
        try {
            // NOTE: 後続でGAS(Web Apps)へ接続する。今はUI/フロー確認用。
            return (bool) (($id + strlen($value)) % 2 === 0);
        } catch (\Throwable $e) {
            Log::warning('CredentialService.syncToGasDummy failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}

