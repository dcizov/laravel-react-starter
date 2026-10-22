<?php

namespace App\Addons;

use Illuminate\Routing\Router;

/**
 * Registers the routes of every installed addon. The routes of an addon are always registered once it is
 * installed, and the addon.active middleware answers 404 while it is inactive. That keeps the route cache valid
 * when addons are switched on and off, because only installing or removing an addon changes the route set.
 *
 * Every addon's routes live under /addons/{slug} and are named addons.{slug}.*, so they cannot collide with the
 * core's routes.
 */
final class AddonRouteLoader
{
    public static function register(Router $router, AddonRegistry $registry): void
    {
        foreach ($registry->installed() as $slug => $entry) {
            $routes = $entry['routes'] ?? null;

            if (! is_string($routes) || ! is_file($routes)) {
                continue;
            }

            $router->middleware(['web', 'addon.active:'.$slug])
                ->prefix('addons/'.$slug)
                ->name('addons.'.$slug.'.')
                ->group($routes);
        }
    }
}
