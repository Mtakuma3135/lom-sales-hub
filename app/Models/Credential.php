<?php

namespace App\Models;

use App\Casts\LegacyCompatibleEncryptedString;
use Illuminate\Database\Eloquent\Model;

class Credential extends Model
{
    /** @var array<int, string> */
    protected $guarded = [];

    /** @var array<string, string> */
    protected $casts = [
        'is_password' => 'boolean',
        'visible_on_credentials_page' => 'boolean',
        'value' => LegacyCompatibleEncryptedString::class,
    ];
}
