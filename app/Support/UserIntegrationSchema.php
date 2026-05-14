<?php

namespace App\Support;

use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * マイグレ未適用の環境でも連携保存が壊れないよう、必要な users 列を不足時のみ追加する。
 */
final class UserIntegrationSchema
{
    private static bool $ensuredThisProcess = false;

    public static function ensureUsersTableColumns(): void
    {
        if (self::$ensuredThisProcess) {
            return;
        }

        if (! Schema::hasTable('users')) {
            self::$ensuredThisProcess = true;

            return;
        }

        $columns = ['kot_personal_api_token', 'personal_discord_webhook_url', 'extra_integrations'];
        $missing = false;
        foreach ($columns as $col) {
            if (! Schema::hasColumn('users', $col)) {
                $missing = true;
                break;
            }
        }

        if (! $missing) {
            self::$ensuredThisProcess = true;

            return;
        }

        try {
            Schema::table('users', function (Blueprint $table) use ($columns): void {
                foreach ($columns as $col) {
                    if (! Schema::hasColumn('users', $col)) {
                        $table->text($col)->nullable();
                    }
                }
            });
        } catch (Throwable $e) {
            if (! self::isDuplicateColumnError($e)) {
                throw $e;
            }
        }

        self::$ensuredThisProcess = true;
    }

    private static function isDuplicateColumnError(Throwable $e): bool
    {
        if ($e instanceof QueryException) {
            $code = $e->errorInfo[1] ?? null;

            return $code === 1060 || str_contains($e->getMessage(), 'Duplicate column');
        }

        return str_contains($e->getMessage(), 'Duplicate column');
    }
}
