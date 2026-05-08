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
        $published = $this->resource['published_at'] ?? null;
        if ($published instanceof \DateTimeInterface) {
            $published = $published->format('Y-m-d H:i:s');
        }

        return [
            'id' => $this->resource['id'],
            'title' => $this->resource['title'],
            'body' => $this->resource['body'],
            'is_pinned' => (bool) $this->resource['is_pinned'],
            'published_at' => $published,
        ];
    }
}

