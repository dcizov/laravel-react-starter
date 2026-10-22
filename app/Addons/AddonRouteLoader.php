<?php

namespace App\Addons;

use Illuminate\Routing\Router;
use WeakMap;

/**
 * Registers the routes of the installed addons. The routes of an addon are always registered once it is
 * installed, and the addon.active middleware answers 404 while it is inactive. That keeps the route cache valid
 * when addons are switched on and off, because only installing or removing an addon changes the route set.
 *
 * Every addon's routes live under /addons/{slug} and are named addons.{slug}.*, so they cannot collide with the
 * core's routes. An addon that sets provides.routes_mount to "root" is mounted at the root instead, with the names
 * its route file gives. Only use that for an addon that replaces a built-in page and keeps its URLs.
 *
 * The routes are added once per router. Routes added after the application has booted need their names indexed
 * again, which Laravel does only once at the end of boot. This class does that itself.
 */
final class AddonRouteLoader
{
    /**
     * The addon slugs whose routes are already on each router. Keyed by router, so every application starts empty.
     *
     * @var WeakMap<Router, array<string, true>>|null
     */
    private static ?WeakMap $loaded = null;

    /**
     * Register the routes of every installed addon that is not on this router yet.
     */
    public static function register(Router $router, AddonRegistry $registry): void
    {
        self::load($router, $registry->installed());
    }

    /**
     * Mark the installed addons as registered without adding routes. Used when the routes come from the route
     * cache, which was built with the same installed set.
     */
    public static function acknowledge(Router $router, AddonRegistry $registry): void
    {
        $loaded = self::loadedOn($router);

        foreach (array_keys($registry->installed()) as $slug) {
            $loaded[(string) $slug] = true;
        }

        self::$loaded[$router] = $loaded;
    }

    /**
     * Register the routes of the given addon entries that are not on this router yet, then index the route names.
     *
     * @param  array<string, array<string, mixed>>  $entries  Compiled manifest entries, by slug.
     */
    public static function load(Router $router, array $entries): void
    {
        $loaded = self::loadedOn($router);
        $added = false;

        foreach ($entries as $slug => $entry) {
            $slug = (string) $slug;

            if (isset($loaded[$slug])) {
                continue;
            }

            $loaded[$slug] = true;

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
            $added = true;
        }

        self::$loaded[$router] = $loaded;

        if ($added) {
            // Names given to a route after it was added are indexed only by refreshNameLookups(), so route() and
            // Router::has() would not find them. The framework calls it once at the end of boot; routes added later
            // need the same refresh.
            $router->getRoutes()->refreshNameLookups();
            $router->getRoutes()->refreshActionLookups();
        }
    }

    /**
     * @return array<string, true>
     */
    private static function loadedOn(Router $router): array
    {
        self::$loaded ??= new WeakMap;

        return self::$loaded[$router] ?? [];
    }
}
