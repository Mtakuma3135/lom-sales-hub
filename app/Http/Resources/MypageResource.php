<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MypageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $credentials = $this->resource['credentials'] ?? collect();

        return [
            'profile' => $this->resource['profile'],
            'attendance' => $this->resource['attendance'] ?? null,
            'kot_status' => $this->resource['kot_status'] ?? null,
            'integrations' => $this->resource['integrations'],
            'integration_meta' => $this->resource['integration_meta'] ?? [
                'kot' => ['system_configured' => false, 'personal_configured' => false],
                'discord' => ['system_configured' => false, 'personal_configured' => false],
                'extras' => [],
            ],
            'credentials' => CredentialResource::collection($credentials),
        ];
    }
}
