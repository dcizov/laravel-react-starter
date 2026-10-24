<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Every value the theme understands.
     */
    public const APPEARANCES = ['light', 'dark', 'system'];

    /**
     * The user's stored preference.
     */
    public const COOKIE = 'appearance';

    /**
     * The light/dark decision that `system` resolved to on the last request.
     *
     * `system` cannot be resolved on the server — only the browser knows the OS
     * preference — so the pre-paint script in the root template records what it
     * saw and this cookie lets the *next* server render deliver markup that
     * already matches. That keeps the server and the first client render in
     * agreement instead of letting React discover the difference while
     * hydrating.
     */
    public const RESOLVED_COOKIE = 'appearance_resolved';

    public const RESOLVED = ['light', 'dark'];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        ['appearance' => $appearance, 'resolved' => $resolved] = self::read($request);

        View::share('appearance', $appearance);
        View::share('appearanceResolved', $resolved);

        return $next($request);
    }

    /**
     * The appearance of a request: the stored preference and the light/dark
     * value the first paint should use.
     *
     * Both are needed in two places — the root template and the Inertia shared
     * props — so the resolution lives here and nowhere else. The client seeds
     * its store from the shared props, which is what keeps the browser's first
     * render identical to the server's.
     *
     * @return array{appearance: string, resolved: string}
     */
    public static function read(Request $request): array
    {
        // The cookie is readable and writable by the client, so it is
        // normalised to the three legal states before it reaches the template.
        $appearance = $request->cookie(self::COOKIE);
        $appearance = is_string($appearance) && in_array($appearance, self::APPEARANCES, true)
            ? $appearance
            : 'system';

        // An explicit choice always wins; `system` reuses the value the browser
        // reported last time and falls back to light on a first visit.
        $cookie = $request->cookie(self::RESOLVED_COOKIE);

        $resolved = $appearance === 'light' || $appearance === 'dark'
            ? $appearance
            : (is_string($cookie) && in_array($cookie, self::RESOLVED, true) ? $cookie : 'light');

        return ['appearance' => $appearance, 'resolved' => $resolved];
    }
}
