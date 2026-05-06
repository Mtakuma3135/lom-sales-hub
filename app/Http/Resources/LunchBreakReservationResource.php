<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LunchBreakReservationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $actor = $request->user();
        $isAdmin = (($actor?->role ?? 'general') === 'admin');
        $isSelf = $actor && (int) ($this->resource->user_id ?? 0) === (int) $actor->id;

        $canExposeFullUser = $isAdmin || $isSelf;

        return [
            'id' => $this->resource->id,
            'date' => (string) $this->resource->date,
            'start_time' => (string) $this->resource->start_time,
            'end_time' => (string) $this->resource->end_time,
            'user' => [
                'id' => $canExposeFullUser ? $this->resource->user?->id : null,
                'name' => (string) ($this->resource->user?->name ?? '—'),
                'role' => $canExposeFullUser ? $this->resource->user?->role : null,
            ],
        ];
    }
}

