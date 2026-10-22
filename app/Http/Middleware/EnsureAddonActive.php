<?php

namespace App\Http\Middleware;

use App\Addons\AddonRegistry;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Answers 404 for the routes of an addon that is not active. The addon's routes stay registered, so the route
 * cache does not change when it is switched off.
 */
final class EnsureAddonActive
{
    public function __construct(private readonly AddonRegistry $registry) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string $slug): Response
    {
        if (! $this->registry->isActive($slug)) {
            abort(404);
        }

        return $next($request);
    }
}
