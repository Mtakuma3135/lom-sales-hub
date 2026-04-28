<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource['id'],
            'name' => $this->resource['name'],
            'category' => $this->resource['category'],
            'price' => (int) $this->resource['price'],
            'is_active' => (bool) $this->resource['is_active'],
            'updated_at' => $this->resource['updated_at'],
            'talk_script' => $this->resource['talk_script'] ?? '',
            'manual_url' => $this->resource['manual_url'] ?? '',
        ];
    }
}

