<?php

namespace App\Notifications\Discord;

class DiscordPayloadFactory
{
    /**
     * @param  array<int, array{id:int,name:string}>  $users
     * @return array{content:string}
     */
    public static function lunchBreakAssigned(array $users, string $startTime, string $endTime): array
    {
        $names = array_values(array_filter(array_map(
            fn (array $u) => (string) ($u['name'] ?? ''),
            $users
        )));

        $who = $names !== [] ? implode(' / ', $names) : '—';

        $text = "【休憩アサイン】\n".
            "対象: {$who}\n".
            "時間: {$startTime} 〜 {$endTime}\n".
            "開始までにタスクを整えて、スマートに離脱しましょう。";

        return ['content' => $text];
    }

    /**
     * @return array{content:string}
     */
    public static function lunchBreakEnded(string $userName): array
    {
        $name = $userName !== '' ? $userName : '—';

        $text = "【休憩終了】{$name} さん\n".
            "休憩時間が終了しました。\n".
            "エネルギー満タンで、業務へリブートしてください。";

        return ['content' => $text];
    }

    /**
     * 業務依頼作成時の Discord 通知本文
     *
     * @return array{content:string}
     */
    public static function taskRequestCreated(string $fromName, string $toName, string $title): array
    {
        $text = "【業務依頼】\n".
            "宛先: {$toName}\n".
            "差出人: {$fromName}\n".
            "件名: {$title}";

        return ['content' => $text];
    }

    public static function csvCompleted(int $uploadId, string $filename, int $successCount, int $failedCount): array
    {
        $text = "【CSV取込完了】\n".
            "ID: {$uploadId}\n".
            "ファイル: {$filename}\n".
            "成功: {$successCount} / 失敗: {$failedCount}";

        return ['content' => $text];
    }
}

