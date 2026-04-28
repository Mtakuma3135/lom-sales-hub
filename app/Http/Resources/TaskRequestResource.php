<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource['id'],
            'title' => $this->resource['title'],
            'requester' => $this->resource['requester'],
            'priority' => $this->resource['priority'],
            'status' => $this->resource['status'],
            'due_date' => $this->resource['due_date'],
            'created_at' => $this->resource['created_at'],
            'body' => $this->resource['body'] ?? '',
            'to_user_id' => $this->resource['to_user_id'] ?? null,
            'from_user_id' => $this->resource['from_user_id'] ?? null,
            'chat_sent' => (bool) ($this->resource['chat_sent'] ?? false),
        ];
    }
}

