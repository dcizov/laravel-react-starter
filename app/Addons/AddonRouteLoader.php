<?php

namespace App\Addons;

use Illuminate\Routing\Router;

/**
 * Registers the routes of every installed addon. The routes of an addon are always registered once it is
 * installed, and the addon.active middleware answers 404 while it is inactive. That keeps the route cache valid
 * when addons are switched on and off, because only installing or removing an addon changes the route set.
 *
 * Every addon's routes live under /addons/{slug} and are named addons.{slug}.*, so they cannot collide with the
 * core's routes. An addon that sets provides.routes_mount to "root" is mounted at the root instead, with the names
 * its route file gives. Only use that for an addon that replaces a built-in page and keeps its URLs.
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

            $group = $router->middleware(['web', 'addon.active:'.$slug]);

            // A root-mounted addon keeps the URLs and route names its routes already have. See ManifestValidator::ROUTE_MOUNTS.
            if (($entry['routes_mount'] ?? 'addon') !== 'root') {
                $group = $group->prefix('addons/'.$slug)->name('addons.'.$slug.'.');
            }

            $group->group($routes);
        }
    }
}
