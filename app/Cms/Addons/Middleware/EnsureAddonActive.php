<?php

namespace App\Cms\Addons\Middleware;

use App\Cms\Repositories\AddonRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * An addon's route files are only loaded for active addons, but a cached
 * route table (or a long-lived worker) can outlive a deactivation. Guarding
 * the routes themselves guarantees a disabled addon answers 404 instead of
 * serving half a product — and never touches a single row of its data.
 */
final class EnsureAddonActive
{
    public function __construct(private readonly AddonRepository $addons) {}

    public function handle(Request $request, Closure $next, string $handle): Response
    {
        $addon = $this->addons->find($handle);

        abort_unless($addon !== null && $addon->status === 'active', 404);

        return $next($request);
    }
}
