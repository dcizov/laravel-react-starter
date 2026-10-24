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
 *
 * The dev server also serves the stylesheet and the fonts as *cross-origin*
 * URLs (`http://localhost:5173/resources/css/app.css`), which `'self'` does not
 * cover. A nonce cannot help there: nonces apply to `<script>`/`<style>`
 * elements, not to a `<link rel="stylesheet">`. Without the origin in
 * `style-src`/`font-src` the browser blocks the sheet and the page renders
 * unstyled while every script still runs — so the origin is read from the Vite
 * hot file and allowed for exactly as long as that file exists.
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
        $fontSrc = [self::CDN_FREE, 'data:'];
        $imgSrc = [self::CDN_FREE, 'data:', 'blob:'];

        if ($local) {
            $scriptSrc[] = "'unsafe-eval'";
            $connectSrc = [self::CDN_FREE, 'ws:', 'wss:'];
            $imgSrc[] = 'http:';

            foreach ($this->viteDevOrigins() as $origin) {
                // The dev server hosts the module graph (imports are fetched
                // without a nonce), the generated stylesheet and the fonts it
                // references, so all three directives need the origin.
                $scriptSrc[] = $origin;
                $connectSrc[] = $origin;
                $styleSrc[] = $origin;
                $fontSrc[] = $origin;
            }
        }

        $policy = implode('; ', [
            "default-src 'self'",
            'script-src '.implode(' ', array_unique($scriptSrc)),
            'style-src '.implode(' ', array_unique($styleSrc)),
            'img-src '.implode(' ', array_unique($imgSrc)),
            'font-src '.implode(' ', array_unique($fontSrc)),
            'connect-src '.implode(' ', array_unique($connectSrc)),
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

    /**
     * Origins the running Vite dev server serves assets from.
     *
     * `public/hot` is written by Vite while `npm run dev` runs and deleted when
     * it stops, which makes it the only reliable source: the port is
     * configurable (`VITE_PORT`) and a stray `APP_URL` says nothing about it.
     * Anything that is not a plain http(s) origin is ignored, so a malformed or
     * hostile file cannot inject directives into the policy.
     *
     * @return list<string>
     */
    private function viteDevOrigins(): array
    {
        $hotFile = public_path('hot');

        if (! is_file($hotFile)) {
            return [];
        }

        $url = trim((string) file_get_contents($hotFile));
        $parts = parse_url($url);

        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            return [];
        }

        $scheme = strtolower($parts['scheme']);

        if (! in_array($scheme, ['http', 'https'], true)) {
            return [];
        }

        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return [$scheme.'://'.$parts['host'].$port];
    }
}
