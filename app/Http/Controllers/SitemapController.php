<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Cms\Content\Homepage;
use App\Models\Page;
use Illuminate\Http\Response;

/**
 * `sitemap.xml` and `robots.txt` for the public site. Both are generated from
 * published pages only — a draft can never leak into the sitemap.
 */
class SitemapController extends Controller
{
    public function __construct(private readonly Homepage $homepage) {}

    public function sitemap(): Response
    {
        $pages = Page::query()
            ->where('status', Page::STATUS_PUBLISHED)
            ->where('published_at', '<=', now())
            ->where('robots', 'not like', '%noindex%')
            ->orderByDesc('updated_at')
            ->get(['slug', 'updated_at']);

        $homepage = $this->homepage->slug();

        $xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
        $xml[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($pages as $page) {
            $location = $page->slug === $homepage ? url('/') : url('/'.$page->slug);

            $xml[] = '  <url>';
            $xml[] = '    <loc>'.htmlspecialchars($location, ENT_XML1).'</loc>';
            $xml[] = '    <lastmod>'.$page->updated_at?->toAtomString().'</lastmod>';
            $xml[] = '  </url>';
        }

        $xml[] = '</urlset>';

        return response(implode("\n", $xml), 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
        ]);
    }

    public function robots(): Response
    {
        $lines = [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /preview',
            'Disallow: /settings',
            'Disallow: /invitations',
            '',
            'Sitemap: '.url('/sitemap.xml'),
        ];

        return response(implode("\n", $lines)."\n", 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
