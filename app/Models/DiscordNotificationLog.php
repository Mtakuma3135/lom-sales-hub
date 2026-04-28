<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiscordNotificationLog extends Model
{
    /** @var array<int, string> */
    protected $guarded = [];

    /** @var array<string, string> */
    protected $casts = [
        'payload' => 'array',
        'status_code' => 'integer',
        'parent_id' => 'integer',
        'triggered_by' => 'integer',
    ];
}

