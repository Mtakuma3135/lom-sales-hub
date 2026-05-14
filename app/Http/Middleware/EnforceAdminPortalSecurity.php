<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\Network\AdminIpAllowlist;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * §3.1 admin_allowed_ips / enforce_admin_two_factor — Web セッションの管理者向け。
 * API（Sanctum）は別経路のため本ミドルウェアの対象外。
 */
final class EnforceAdminPortalSecurity
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return $next($request);
        }

        if (($user->role ?? 'general') !== 'admin') {
            return $next($request);
        }

        if ($this->isExemptRoute($request)) {
            return $next($request);
        }

        $allowedIps = config('lom.admin_allowed_ips', []);
        if (is_array($allowedIps) && $allowedIps !== []) {
            $ip = (string) $request->ip();
            if (! AdminIpAllowlist::matches($ip, $allowedIps)) {
                abort(403, '管理者アクセスは許可されたネットワークからのみ利用できます。');
            }
        }

        if (config('lom.enforce_admin_two_factor') && ! $user->hasTwoFactorEnabled()) {
            return redirect()->route('portal.two-factor.setup');
        }

        return $next($request);
    }

    private function isExemptRoute(Request $request): bool
    {
        return $request->routeIs(
            'portal.two-factor.setup',
            'portal.two-factor.store',
            'logout',
        );
    }
}
