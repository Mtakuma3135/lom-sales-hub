<?php

namespace App\Http\Resources;

use App\Models\Credential;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Credential
 */
class CredentialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $password = $this->is_password ? (string) $this->value : '';

        $isMock = (bool) ($this->getAttribute('is_mock') ?? false);

        return [
            'id' => (int) $this->id,
            'service_name' => (string) $this->label,
            'login_id' => (string) ($this->login_id ?? ''),
            'password' => $password,
            'is_password' => (bool) $this->is_password,
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s') ?? '',
            'is_mock' => $isMock,
        ];
    }
}
