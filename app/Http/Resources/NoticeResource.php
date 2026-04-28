<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoticeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource['id'],
            'title' => $this->resource['title'],
            'body' => $this->resource['body'],
            'is_pinned' => (bool) $this->resource['is_pinned'],
            'published_at' => $this->resource['published_at'],
        ];
    }
}

