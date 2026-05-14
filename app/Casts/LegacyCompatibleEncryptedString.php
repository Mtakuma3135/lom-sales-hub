<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * Laravel の encrypted と同等に保存しつつ、既存の平文レガシー行は読み取りで落とさない。
 */
class LegacyCompatibleEncryptedString implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value === '') {
            return '';
        }

        if (! is_string($value)) {
            return (string) $value;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return $value;
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null) {
            return [$key => null];
        }

        // 空文字も暗号化して保存する（credentials.value 等 NOT NULL 列で null を書かない）
        return [$key => Crypt::encryptString((string) $value)];
    }
}
