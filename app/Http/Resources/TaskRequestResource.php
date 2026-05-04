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
        $discordQueued = (bool) ($this->resource['chat_sent'] ?? false);

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
            // chat_sent: 互換用。Discord 通知キュー投入成功と同義（discord_notification_queued）
            'chat_sent' => $discordQueued,
            'discord_notification_queued' => $discordQueued,
        ];
    }
}

