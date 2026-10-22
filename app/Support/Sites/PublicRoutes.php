<?php

namespace App\Support\Sites;

use Closure;
use Illuminate\Support\Facades\Route;

/**
 * Registers the public routes twice: at the root for the default site and for sites with a domain, and under
 * /s/{site} for sites reached by path. Both copies carry the same route names. Laravel keeps the first route
 * registered under a name, so the root copy is registered first: route('blog.index') produces the root URL, and a
 * request on /s/{site} adds the prefix through forceRootUrl. The home route's /s/{site} copy is named site.home
 * (see routes/web.php).
 */
final class PublicRoutes
{
    public const SLUG_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*';

    public static function register(Closure $routes): void
    {
        Route::middleware('web')->group($routes);

        Route::middleware('web')
            ->prefix('s/{site}')
            ->where(['site' => self::SLUG_PATTERN])
            ->group($routes);
    }
}
