<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Credential;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

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

            $discordGlobal = trim((string) config('services.discord.webhook_url', '')) !== '';

            $kotGlobal = $this->kotBackendConfigured();
            $kotPersonal = $user !== null && trim((string) ($user->kot_personal_api_token ?? '')) !== '';
            $discordPersonal = $user !== null && trim((string) ($user->personal_discord_webhook_url ?? '')) !== '';

            $kotConnected = $kotGlobal || $kotPersonal;
            $discordConfigured = $discordGlobal || $discordPersonal;

            $integrations = collect([
                ['key' => 'king_of_time', 'label' => 'KING OF TIME', 'status' => $kotConnected ? 'connected' : 'not_connected'],
                ['key' => 'discord', 'label' => 'Discord（通知）', 'status' => $discordConfigured ? 'connected' : 'not_connected'],
            ]);

            $extrasMeta = [];
            if ($user !== null) {
                $rawExtras = $user->extra_integrations;
                if (is_iterable($rawExtras)) {
                    foreach ($rawExtras as $row) {
                        if (! is_array($row)) {
                            continue;
                        }
                        $has = trim((string) ($row['token_value'] ?? '')) !== '';
                        $label = trim((string) ($row['label'] ?? ''));
                        $integrations->push([
                            'key' => 'extra:'.sha1(($label !== '' ? $label : 'x').(string) ($row['token_label'] ?? '')),
                            'label' => $label !== '' ? $label : 'その他連携',
                            'status' => $has ? 'connected' : 'not_connected',
                        ]);
                        $extrasMeta[] = [
                            'label' => (string) ($row['label'] ?? ''),
                            'token_label' => (string) ($row['token_label'] ?? ''),
                            'has_value' => $has,
                        ];
                    }
                }
            }

            $kotStatus = $user ? $this->kotStatusFromAuditLog($user) : null;

            $integrationMeta = [
                'kot' => [
                    'system_configured' => $kotGlobal,
                    'personal_configured' => $kotPersonal,
                ],
                'discord' => [
                    'system_configured' => $discordGlobal,
                    'personal_configured' => $discordPersonal,
                ],
                'extras' => $extrasMeta,
            ];

            return [
                'profile' => $profile,
                'attendance' => $attendance,
                'kot_status' => $kotStatus,
                'integrations' => $integrations,
                'integration_meta' => $integrationMeta,
                'credentials' => $this->credentials(),
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
                'kot_status' => null,
                'integrations' => collect(),
                'integration_meta' => [
                    'kot' => ['system_configured' => false, 'personal_configured' => false],
                    'discord' => ['system_configured' => false, 'personal_configured' => false],
                    'extras' => [],
                ],
                'credentials' => collect(),
            ];
        }
    }

    /**
     * @return array{connected:bool,last_event_type:?string,last_status:?string,last_status_code:?int,last_at:?string,last_message:?string,mode:?string}
     */
    private function kotStatusFromAuditLog(User $user): array
    {
        $connected = $this->kotBackendConfigured();

        $log = AuditLog::query()
            ->where('integration', 'kot')
            ->where('actor_id', (int) $user->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();

        if (! $log) {
            return [
                'connected' => $connected,
                'last_event_type' => null,
                'last_status' => null,
                'last_status_code' => null,
                'last_at' => null,
                'last_message' => null,
                'mode' => null,
            ];
        }

        $meta = is_array($log->meta) ? $log->meta : [];
        $mode = null;
        if (is_string($log->mode ?? null) && $log->mode !== '') {
            $mode = (string) $log->mode;
        } else {
            $mode = is_string($meta['mode'] ?? null) ? (string) $meta['mode'] : null;
        }

        $msg = null;
        if (is_string($log->error_message) && $log->error_message !== '') {
            $msg = $log->error_message;
        } elseif (is_string($log->response_body) && $log->response_body !== '') {
            $msg = mb_substr($log->response_body, 0, 160);
        } else {
            $msg = null;
        }

        return [
            'connected' => $connected,
            'last_event_type' => is_string($log->event_type) ? (string) $log->event_type : null,
            'last_status' => is_string($log->status) ? (string) $log->status : null,
            'last_status_code' => $log->status_code !== null ? (int) $log->status_code : null,
            'last_at' => $log->created_at?->toISOString(),
            'last_message' => $msg,
            'mode' => $mode,
        ];
    }

    /**
     * @return array{state:string,has_error:bool,error_dates:array<int,string>,cached_at:?string,message?:string}
     */
    public function attendance(User $user): array
    {
        try {
            $apiUrl = trim((string) config('services.kot.api_url', ''));
            $apiToken = trim((string) config('services.kot.api_token', ''));
            if ($apiUrl === '' || $apiToken === '') {
                return [
                    'state' => 'not_connected',
                    'has_error' => false,
                    'error_dates' => [],
                    'cached_at' => null,
                ];
            }

            $key = self::ATTENDANCE_KEY_PREFIX.(string) $user->id;
            $cached = Session::get($key);

            $now = now();
            $inBlackout = $this->isKotBlackout($now);

            if (is_array($cached)) {
                $cachedAt = Carbon::parse((string) ($cached['cached_at'] ?? $now->toISOString()));
                $fresh = $cachedAt->diffInMinutes($now) <= 60;
                if ($fresh || $inBlackout) {
                    $hasErr = (bool) ($cached['has_error'] ?? false);

                    return [
                        'state' => $hasErr ? 'has_error' : 'ok',
                        'has_error' => $hasErr,
                        'error_dates' => array_values(array_filter((array) ($cached['error_dates'] ?? []), 'is_string')),
                        'cached_at' => (string) ($cached['cached_at'] ?? $cachedAt->toISOString()),
                    ];
                }
            }

            return [
                'state' => 'not_fetched',
                'has_error' => false,
                'error_dates' => [],
                'cached_at' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('MypageService.attendance failed', ['error' => $e->getMessage()]);

            return [
                'state' => 'error',
                'has_error' => false,
                'error_dates' => [],
                'cached_at' => null,
                'message' => '勤怠情報の取得に失敗しました。',
            ];
        }
    }

    private function kotBackendConfigured(): bool
    {
        return trim((string) config('services.kot.api_token', '')) !== '';
    }

    /**
     * @return Collection<int, Credential>
     */
    private function credentials(): Collection
    {
        try {
            return Credential::query()
                ->where('visible_on_credentials_page', true)
                ->orderBy('id')
                ->get();
        } catch (\Throwable $e) {
            Log::error('MypageService.credentials failed', ['error' => $e->getMessage()]);

            return collect();
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
    // mockErrorDates() はモック撤廃により削除
}
