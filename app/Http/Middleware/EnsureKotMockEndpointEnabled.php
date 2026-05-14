<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * §3.1 kot_mock_endpoint_enabled — 無効時はモック打刻エンドポイントを 404。
 */
final class EnsureKotMockEndpointEnabled
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('lom.kot_mock_endpoint_enabled')) {
            abort(404);
        }

        return $next($request);
    }
}
