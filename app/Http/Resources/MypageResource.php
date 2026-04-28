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
        return [
            'profile' => $this->resource['profile'],
            'attendance' => $this->resource['attendance'] ?? null,
            'integrations' => $this->resource['integrations'],
            'quick_links' => $this->resource['quick_links'],
        ];
    }
}

