<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Response hardening.
 *
 * The CSP is nonce-based for scripts: the only inline script (the dark-mode
 * bootstrap) carries `nonce="{{ Vite::cspNonce() }}"`, and Vite's own tags get
 * the same nonce automatically. Styles keep `'unsafe-inline'` because the theme
 * writes CSS custom properties as style attributes; that is a styling-only
 * concession and cannot execute script.
 *
 * In local development the Vite dev server needs `unsafe-eval`, its websocket
 * connection and inline styles injected at runtime, so the policy is loosened
 * for that environment only — never in testing or production.
 */
final class SecurityHeaders
{
    private const CDN_FREE = "'self'";

    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Vite::useCspNonce();

        /** @var Response $response */
        $response = $next($request);

        $local = app()->environment('local');

        $scriptSrc = [self::CDN_FREE, "'nonce-{$nonce}'"];
        $connectSrc = [self::CDN_FREE];
        $styleSrc = [self::CDN_FREE, "'unsafe-inline'"];
        $imgSrc = [self::CDN_FREE, 'data:', 'blob:'];

        if ($local) {
            $scriptSrc[] = "'unsafe-eval'";
            $connectSrc = [self::CDN_FREE, 'ws:', 'wss:'];
            $imgSrc[] = 'http:';
        }

        $policy = implode('; ', [
            "default-src 'self'",
            'script-src '.implode(' ', $scriptSrc),
            'style-src '.implode(' ', $styleSrc),
            'img-src '.implode(' ', $imgSrc),
            "font-src 'self' data:",
            'connect-src '.implode(' ', $connectSrc),
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ]);

        // A response that already set its own policy knows better: a streamed
        // document ships `default-src 'none'; sandbox`, which this policy would
        // otherwise widen.
        if (! $response->headers->has('Content-Security-Policy')) {
            $response->headers->set('Content-Security-Policy', $policy);
        }

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        return $response;
    }
}
