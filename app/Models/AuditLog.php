<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    /** @var array<int, string> */
    protected $guarded = [];

    /** @var array<string, string> */
    protected $casts = [
        'request_payload' => 'array',
        'meta' => 'array',
        'status_code' => 'integer',
        'actor_id' => 'integer',
        'related_id' => 'integer',
    ];
}

