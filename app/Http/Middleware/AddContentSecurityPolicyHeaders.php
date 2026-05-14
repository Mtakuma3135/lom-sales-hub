<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * §3.1 csp_connect_src_extra — Inertia + Vite 実運用に合わせた CSP（本番は eval なし）。
 */
final class AddContentSecurityPolicyHeaders
{
    /**
     * Vite 開発サーバー用（APP_DEBUG のみ）。5173 が埋まっている場合は vite 側で VITE_PORT を合わせる。
     *
     * 注意: Chromium は CSP の source に `http://[::1]:…` を書けない（仕様・実装の限界）。待受を IPv6 にしても、
     * ブラウザが読む URL は `http://localhost:…`（vite の server.origin）に揃える想定。
     *
     * @return list<string> http://… （script-src / style-src 用）
     */
    private static function viteDevHttpOrigins(): array
    {
        if (! config('app.debug')) {
            return [];
        }

        $ports = [5173, 5174];
        $hosts = ['127.0.0.1', 'localhost'];
        $out = [];
        foreach ($hosts as $host) {
            foreach ($ports as $port) {
                $out[] = "http://{$host}:{$port}";
            }
        }

        foreach (config('lom.csp_vite_dev_extra', []) as $raw) {
            $o = trim((string) $raw);
            if ($o !== '' && preg_match('#^https?://#i', $o) === 1) {
                $out[] = $o;
            }
        }

        return array_values(array_unique($out));
    }

    /**
     * @return list<string> connect-src 用（HMR の ws + プリフライト等）
     */
    private static function viteDevConnectOrigins(): array
    {
        $http = self::viteDevHttpOrigins();
        $out = [];
        foreach ($http as $url) {
            $out[] = $url;
            if (str_starts_with($url, 'http://')) {
                $out[] = 'ws://'.substr($url, 7);
            } elseif (str_starts_with($url, 'https://')) {
                $out[] = 'wss://'.substr($url, 8);
            }
        }

        return array_values(array_unique($out));
    }

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $connect = ["'self'"];
        foreach (config('lom.csp_connect_src_extra', []) as $origin) {
            $o = trim((string) $origin);
            if ($o !== '') {
                $connect[] = $o;
            }
        }

        $connect = array_merge($connect, self::viteDevConnectOrigins());

        $script = ["'self'", "'unsafe-inline'"];
        if (config('app.debug')) {
            $script[] = "'unsafe-eval'";
            $script = array_merge($script, self::viteDevHttpOrigins());
        }

        $style = ["'self'", "'unsafe-inline'", 'https://fonts.bunny.net'];
        if (config('app.debug')) {
            $style = array_merge($style, self::viteDevHttpOrigins());
        }

        $directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            'script-src '.implode(' ', array_unique($script)),
            'style-src '.implode(' ', array_unique($style)),
            "font-src 'self' https://fonts.bunny.net data:",
            "img-src 'self' data: blob: https:",
            'connect-src '.implode(' ', array_unique($connect)),
        ];

        $response->headers->set('Content-Security-Policy', implode('; ', $directives));

        return $response;
    }
}
