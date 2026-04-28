<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesRecord extends Model
{
    /** @var array<int, string> */
    protected $guarded = [];

    /** @var array<string, string> */
    protected $casts = [
        'csv_upload_id' => 'integer',
        'csv_row_number' => 'integer',
        'department_id' => 'integer',
        'date' => 'date',
        'sales_amount' => 'integer',
        'customer_count' => 'integer',
        'raw' => 'array',
    ];
}

