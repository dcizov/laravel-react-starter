<?php

namespace App\Addons;

use Illuminate\Http\Request;
use Illuminate\Routing\Router;
use ReflectionClass;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Checks that each url an addon declares in provides.pages reaches a route that belongs to that addon. A url with no
 * route, a closure route, or a route whose controller lives in core or in another addon does not count.
 *
 * A declared url is a link from core. If the route behind it is renamed or removed, the link is dead without any error
 * until something checks. This is that check.
 */
final class AddonPageRoutes
{
    /**
     * @param  list<array{page: string, layout: string, url?: string}>  $pages
     * @return list<string>  The declared urls that do not resolve to a route of this addon.
     */
    public static function unresolved(Router $router, array $pages, string $directory): array
    {
        $unresolved = [];

        foreach ($pages as $page) {
            if (! isset($page['url'])) {
                continue;
            }

            $route = null;

            try {
                $route = $router->getRoutes()->match(Request::create($page['url'], 'GET'));
            } catch (HttpException) {
                $route = null;
            }

            if (! self::belongsTo($route?->getControllerClass(), $directory)) {
                $unresolved[] = $page['url'];
            }
        }

        return $unresolved;
    }

    /**
     * A class belongs to an addon when its file lives under the addon's folder.
     */
    private static function belongsTo(?string $class, string $directory): bool
    {
        if ($class === null || ! class_exists($class)) {
            return false;
        }

        $file = (new ReflectionClass($class))->getFileName();

        return is_string($file) && str_starts_with($file, rtrim($directory, '/').'/');
    }
}
