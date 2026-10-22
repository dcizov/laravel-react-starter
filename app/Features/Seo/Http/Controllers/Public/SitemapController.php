<?php

namespace App\Features\Seo\Http\Controllers\Public;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Support\ContentPresenter;
use App\Features\FeatureRegistry;
use App\Http\Controllers\Controller;
use App\Settings\AppSettings;
use App\Support\Sites\CurrentSite;
use Illuminate\Http\Response;

/**
 * sitemap.xml: the home page and every live entry that is not marked noindex. Responds 404 when indexing is off.
 */
class SitemapController extends Controller
{
    public function __invoke(AppSettings $settings, FeatureRegistry $features): Response
    {
        if (! $settings->seo_allow_indexing) {
            abort(404);
        }

        $urls = [];

        $current = app(CurrentSite::class);
        // The landing page belongs to the default site. Other sites list their own home page, when they have one.
        if ($current->isDefault() && $features->isEnabled('landing')) {
            $urls[] = ['loc' => url('/'), 'lastmod' => null];
        }
        if (! $current->isDefault() && $current->site()->homeSlug() !== null) {
            $urls[] = ['loc' => route('pages.show', $current->site()->homeSlug()), 'lastmod' => null];
        }

        $entries = ContentEntry::query()
            ->live()
            ->orderBy('id')
            ->get()
            ->reject(fn (ContentEntry $entry) => (bool) ($entry->seo['noindex'] ?? false));

        foreach ($entries as $entry) {
            $urls[] = [
                'loc' => ContentPresenter::url($entry),
                'lastmod' => $entry->updated_at?->toAtomString(),
            ];
        }

        $body = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($urls as $url) {
            $body .= "  <url>\n    <loc>".e($url['loc'])."</loc>\n";

            if ($url['lastmod'] !== null) {
                $body .= '    <lastmod>'.e($url['lastmod'])."</lastmod>\n";
            }

            $body .= "  </url>\n";
        }

        $body .= '</urlset>'."\n";

        return response($body, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
