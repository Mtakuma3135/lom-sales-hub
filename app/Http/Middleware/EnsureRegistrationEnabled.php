<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * §3.1 registration_enabled — 無効時は登録画面・登録 POST を 404。
 */
final class EnsureRegistrationEnabled
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('lom.registration_enabled')) {
            abort(404);
        }

        return $next($request);
    }
}
