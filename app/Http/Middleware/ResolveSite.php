<?php

namespace App\Http\Middleware;

use App\Models\Site;
use App\Support\Sites\CurrentSite;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

/**
 * Picks the site a request works on, in this order:
 *
 * 1. Admin pages (/admin): the site chosen in the admin's site switcher, or the default site.
 * 2. /s/{slug}: that site, reached by path. Links it produces carry the /s/{slug} prefix.
 * 3. A host name that belongs to a site: that site, reached by domain.
 * 4. Anything else: the default site.
 */
class ResolveSite
{
    public const SESSION_KEY = 'admin_site_id';

    public function handle(Request $request, Closure $next): Response
    {
        $current = app(CurrentSite::class);

        if ($request->is('admin') || $request->is('admin/*')) {
            $siteId = $request->hasSession() ? $request->session()->get(self::SESSION_KEY) : null;
            $site = is_int($siteId) || is_string($siteId)
                ? Site::query()->find($siteId)
                : null;

            $current->use($site ?? Site::default(), CurrentSite::MODE_ADMIN);
        } elseif (($slug = $request->route('site')) !== null) {
            $site = Site::query()->where('slug', $slug)->first();

            abort_if($site === null, 404);

            $current->use($site, CurrentSite::MODE_PATH);
            URL::forceRootUrl($request->getSchemeAndHttpHost().'/s/'.$site->slug);

            // Laravel passes route parameters to controllers by position. Without this, the site segment would
            // shift every later parameter, so a controller's $slug would receive the site's slug.
            $request->route()->forgetParameter('site');
        } else {
            $site = Site::forHost($request->getHost());

            if ($site !== null && ! $site->isDefault()) {
                $current->use($site, CurrentSite::MODE_DOMAIN);
            } else {
                $current->use(Site::default(), CurrentSite::MODE_DEFAULT);
            }
        }

        return $next($request);
    }
}
