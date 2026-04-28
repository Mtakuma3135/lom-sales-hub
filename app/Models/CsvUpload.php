<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CsvUpload extends Model
{
    /** @var array<int, string> */
    protected $guarded = [];

    /** @var array<string, string> */
    protected $casts = [
        'success_count' => 'integer',
        'failed_count' => 'integer',
        'errors' => 'array',
    ];
}

