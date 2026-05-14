<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Discord 送信先: 個人 Webhook（マイページ）を優先し、なければ全体 Webhook（.env）を使う。
 */
final class DiscordWebhookResolver
{
    public static function globalWebhook(): string
    {
        return trim((string) config('services.discord.webhook_url', ''));
    }

    /**
     * ユーザー起点の通知用（KOT 打刻・昼休憩終了など）
     */
    public static function forUser(User $user): string
    {
        $personal = trim((string) ($user->personal_discord_webhook_url ?? ''));

        return $personal !== '' ? $personal : self::globalWebhook();
    }

    /**
     * 業務依頼: 主に宛先ユーザーへ届ける
     */
    public static function forTaskRequestRecipient(User $to): string
    {
        return self::forUser($to);
    }

    /**
     * 昼休憩の割当通知: 全体チャンネルがあればそこだけ。なければ割当先ユーザーの個人 Webhook へ送る。
     *
     * @param  Collection<int, User>  $users
     * @return list<string>
     */
    public static function urlsForLunchAssignment(Collection $users): array
    {
        $global = self::globalWebhook();
        if ($global !== '') {
            return [$global];
        }

        $seen = [];
        $out = [];
        foreach ($users as $u) {
            if (! $u instanceof User) {
                continue;
            }
            $p = trim((string) ($u->personal_discord_webhook_url ?? ''));
            if ($p !== '' && ! isset($seen[$p])) {
                $seen[$p] = true;
                $out[] = $p;
            }
        }

        return $out;
    }
}
