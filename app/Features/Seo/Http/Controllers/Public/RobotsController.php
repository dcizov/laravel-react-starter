<?php

namespace App\Features\Seo\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Settings\AppSettings;
use Illuminate\Http\Response;

/**
 * robots.txt. Points crawlers at the sitemap, or asks them to stay away while indexing is off.
 */
class RobotsController extends Controller
{
    public function __invoke(AppSettings $settings): Response
    {
        $lines = ['User-agent: *'];

        if ($settings->seo_allow_indexing) {
            $lines[] = 'Allow: /';
            $lines[] = '';
            $lines[] = 'Sitemap: '.url('/sitemap.xml');
        } else {
            $lines[] = 'Disallow: /';
        }

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
