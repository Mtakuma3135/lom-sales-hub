<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastUsedAt
{
    private const EXPIRE_MINUTES = 180;

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        if (! $user || ! $token) {
            return $next($request);
        }

        // Webセッション等で TransientToken になる場合があるため、DBトークンのみ対象にする
        if (! $token instanceof PersonalAccessToken) {
            return $next($request);
        }

        $lastUsedAt = $token->last_used_at ?? $token->created_at;
        $expiredAt = now()->subMinutes(self::EXPIRE_MINUTES);

        if ($lastUsedAt && $lastUsedAt->lt($expiredAt)) {
            $token->delete();

            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $token->last_used_at = now();
        $token->save();

        return $next($request);
    }
}

