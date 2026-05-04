<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Carbon;

class MypageService
{
    private const ATTENDANCE_KEY_PREFIX = 'mypage.attendance.';

    /**
     * @return array<string, mixed>
     */
    public function index(?User $user): array
    {
        try {
            $profile = [
                'name' => $user?->name ?? 'ゲストユーザー',
                'employee_code' => $user?->employee_code ?? null,
                'role' => $user?->role ?? 'general',
            ];

            $attendance = null;
            if ($user !== null) {
                $attendance = $this->attendance($user);
            }

            $discordConfigured = (string) config('services.discord.webhook_url', '') !== '';

            $integrations = collect([
                ['key' => 'king_of_time', 'label' => 'KING OF TIME', 'status' => 'connected'],
                ['key' => 'discord', 'label' => 'Discord（通知）', 'status' => $discordConfigured ? 'connected' : 'not_connected'],
            ]);

            $quickLinks = collect([
                ['label' => '勤怠管理', 'href' => '#'],
                ['label' => '商材一覧', 'href' => '#'],
                ['label' => '周知事項', 'href' => '#'],
                ['label' => '業務依頼', 'href' => '#'],
            ]);

            return [
                'profile' => $profile,
                'attendance' => $attendance,
                'integrations' => $integrations,
                'quick_links' => $quickLinks,
            ];
        } catch (\Throwable $e) {
            Log::error('MypageService.index failed', ['error' => $e->getMessage()]);
            return [
                'profile' => [
                    'name' => 'ゲストユーザー',
                    'employee_code' => null,
                    'role' => 'general',
                ],
                'attendance' => null,
                'integrations' => collect(),
                'quick_links' => collect(),
            ];
        }
    }

    /**
     * @return array{has_error:bool,error_dates:array<int,string>,cached_at:string}
     */
    public function attendance(User $user): array
    {
        try {
            $key = self::ATTENDANCE_KEY_PREFIX.(string) $user->id;
            $cached = Session::get($key);

            $now = now();
            $inBlackout = $this->isKotBlackout($now);

            if (is_array($cached)) {
                $cachedAt = Carbon::parse((string) ($cached['cached_at'] ?? $now->toISOString()));
                $fresh = $cachedAt->diffInMinutes($now) <= 60;
                if ($fresh || $inBlackout) {
                    return [
                        'has_error' => (bool) ($cached['has_error'] ?? false),
                        'error_dates' => (array) ($cached['error_dates'] ?? []),
                        'cached_at' => (string) ($cached['cached_at'] ?? $cachedAt->toISOString()),
                    ];
                }
            }

            // NOTE: 実KOT連携前のモック（決定論的に生成）
            $errorDates = $this->mockErrorDates($user, $now);
            $row = [
                'has_error' => count($errorDates) > 0,
                'error_dates' => $errorDates,
                'cached_at' => $now->toISOString(),
            ];

            Session::put($key, $row);

            return $row;
        } catch (\Throwable $e) {
            Log::error('MypageService.attendance failed', ['error' => $e->getMessage()]);
            return [
                'has_error' => false,
                'error_dates' => [],
                'cached_at' => now()->toISOString(),
            ];
        }
    }

    private function isKotBlackout(\DateTimeInterface $now): bool
    {
        $t = Carbon::instance($now)->format('H:i');

        // 08:30〜10:00 / 17:30〜18:30
        return ($t >= '08:30' && $t <= '10:00') || ($t >= '17:30' && $t <= '18:30');
    }

    /**
     * @return array<int, string>
     */
    private function mockErrorDates(User $user, Carbon $now): array
    {
        $base = (int) $user->id % 3;
        if ($base === 0) {
            return [];
        }

        $d1 = $now->copy()->startOfMonth()->addDays(2 + $base)->format('Y-m-d');
        $d2 = $now->copy()->startOfMonth()->addDays(9 + $base)->format('Y-m-d');

        return [$d1, $d2];
    }
}

