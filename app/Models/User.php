<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * 一括代入可能な属性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'department_id',
        'employee_code',
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'internal_policy_explained_at',
        'internal_policy_version',
    ];

    /**
     * モデルで非表示にする属性
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_hashes',
    ];

    /**
     * 型変換する属性
     *
     * @var array<string, string>
     */
    protected $casts = [
        'department_id' => 'integer',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'internal_policy_explained_at' => 'datetime',
        'two_factor_secret' => 'encrypted',
        'two_factor_recovery_hashes' => 'array',
        'two_factor_confirmed_at' => 'datetime',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_confirmed_at !== null && $this->two_factor_secret !== null;
    }

    /**
     * パスワード変更・リセット後に全 Sanctum トークンを失効（漏洩トークンの窓を閉じる）。
     */
    public function revokeAllTokens(): void
    {
        $this->tokens()->delete();
    }
}

