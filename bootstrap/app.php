<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Commands in a custom namespace are not auto-discovered.
    ->withCommands([
        __DIR__.'/../app/Cms/Console/Commands',
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        // `appearance` and `appearance_resolved` are written by the browser (the
        // pre-paint script and the appearance store), so both must stay readable
        // as plain cookies; `sidebar_state` follows the same rule.
        $middleware->encryptCookies(except: ['appearance', 'appearance_resolved', 'sidebar_state']);

        // Lattice is meant to run behind a reverse proxy (TLS is terminated
        // there), but only proxies the operator names are trusted: trusting
        // every address lets a client forge `X-Forwarded-For`, which defeats
        // IP-based throttling and corrupts every logged client address.
        // Empty by default = trust nothing, which is correct for `artisan
        // serve`, Sail and a direct connection.
        $middleware->trustProxies(
            at: array_values(array_filter(array_map('trim', explode(',', (string) env('TRUSTED_PROXIES', ''))))),
            headers: Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO,
        );

        $middleware->alias([
            'active' => EnsureUserIsActive::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SecurityHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
