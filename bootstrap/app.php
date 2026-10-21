<?php

use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            SetLocale::class,
            HandleInertiaRequests::class,
            EnsureAccountIsActive::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Outside local and testing, these errors get the app's own pages instead of Laravel's.
        // Local keeps Laravel's debug page. The pages can be previewed at /errors/{code} in local.
        $exceptions->respond(function ($response, \Throwable $exception, Request $request) {
            $status = $response->getStatusCode();
            $errorPages = [
                401 => 'errors/unauthorized-error',
                403 => 'errors/forbidden',
                404 => 'errors/not-found-error',
                500 => 'errors/general-error',
                503 => 'errors/maintenance-error',
            ];

            $wantsJson = $request->expectsJson() || $request->is('api/*');

            if (app()->environment(['local', 'testing']) || $wantsJson || ! isset($errorPages[$status])) {
                return $response;
            }

            return Inertia::render($errorPages[$status])
                ->toResponse($request)
                ->setStatusCode($status);
        });
    })->create();
