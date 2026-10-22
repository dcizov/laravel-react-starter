<?php

namespace App\Support\Sites;

use Closure;
use Illuminate\Support\Facades\Route;

/**
 * Registers the public routes twice: under /s/{site} for sites reached by path, and at the root for the default
 * site and for sites with a domain. Both copies carry the same route names. The root copy is registered last, so
 * route('blog.index') produces the root URL, and a request on /s/{site} adds the prefix through forceRootUrl.
 * The home route is the exception: its /s/{site} copy is named site.home (see routes/web.php).
 */
final class PublicRoutes
{
    public const SLUG_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*';

    public static function register(Closure $routes): void
    {
        Route::middleware('web')
            ->prefix('s/{site}')
            ->where(['site' => self::SLUG_PATTERN])
            ->group($routes);

        Route::middleware('web')->group($routes);
    }
}
