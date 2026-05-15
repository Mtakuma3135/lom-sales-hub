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

        $who = $names !== [] ? implode('・', $names) : '—';

        return ['content' => "☕ {$who}さん、{$startTime}〜{$endTime}の昼休憩です！いってらっしゃい🍽️"];
    }

    /**
     * @return array{content:string}
     */
    public static function lunchBreakEnded(string $userName): array
    {
        $name = $userName !== '' ? $userName : '—';

        return ['content' => "✅ {$name}さんの昼休憩が終了しました。お疲れ様です！"];
    }

    /**
     * @return array{content:string}
     */
    public static function lunchBreakScheduleUpdated(string $actorName, string $date): array
    {
        $who = $actorName !== '' ? $actorName : '—';

        return ['content' => "📅 昼休憩のタイムテーブルが更新されました！（{$date} / 更新者: {$who}）"];
    }

    /**
     * @param  'success'|'skipped'|'duplicate'  $outcome
     * @return array{content:string}
     */
    public static function kotPunchRecorded(
        string $userName,
        string $employeeCode,
        string $outcome,
        string $atIso,
        ?int $httpStatus = null,
    ): array {
        $name = $userName !== '' ? $userName : '—';

        if ($outcome === 'success') {
            return ['content' => "🕐 {$name}さんが KOT打刻しました（{$atIso}）"];
        }

        if ($outcome === 'duplicate') {
            return ['content' => "🕐 {$name}さんの打刻は重複のため処理済みとしました（{$atIso}）"];
        }

        return ['content' => "🕐 {$name}さんの打刻を記録しました（{$atIso}）"];
    }

    /**
     * @param  array<int, string>  $userNames
     * @return array{content:string}
     */
    public static function lunchBreakNotStartedAlert(string $date, array $userNames): array
    {
        $who = $userNames !== [] ? implode('・', $userNames) : '—';

        return ['content' => "⚠️ 昼休憩がまだ開始されていません！（{$date}）\n対象: {$who}さん"];
    }

    /**
     * @return array{content:string}
     */
    public static function taskRequestCreated(string $fromName, string $toName, string $title): array
    {
        return ['content' => "📋 {$toName}さんに業務依頼が届きました！\n「{$title}」（依頼者: {$fromName}）"];
    }

    /**
     * @return array{content:string}
     */
    public static function csvCompleted(int $uploadId, string $filename, int $successCount, int $failedCount): array
    {
        return ['content' => "📊 成績更新されました！OK率確認をしてください！"];
    }
}
