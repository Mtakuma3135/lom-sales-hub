<?php

use App\Http\Middleware\AddContentSecurityPolicyHeaders;
use App\Http\Middleware\EnforceAdminPortalSecurity;
use App\Http\Middleware\EnsureKotMockEndpointEnabled;
use App\Http\Middleware\EnsureRegistrationEnabled;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('lunch:alert-not-started')->everyMinute();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $proxies = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('TRUSTED_PROXIES', ''))
        )));

        if ($proxies !== []) {
            $middleware->trustProxies(
                at: $proxies,
                headers: Request::HEADER_X_FORWARDED_FOR
                    | Request::HEADER_X_FORWARDED_HOST
                    | Request::HEADER_X_FORWARDED_PORT
                    | Request::HEADER_X_FORWARDED_PROTO
                    | Request::HEADER_X_FORWARDED_AWS_ELB,
            );
        }

        $middleware->alias([
            'lom.registration' => EnsureRegistrationEnabled::class,
            'lom.kot.mock' => EnsureKotMockEndpointEnabled::class,
        ]);

        $middleware->web(append: [
            AddContentSecurityPolicyHeaders::class,
            EnforceAdminPortalSecurity::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
