<?php

namespace App\Http\Controllers;

use App\Features\FeatureRegistry;
use App\Features\Landing\LandingBlocks;
use App\Features\Landing\LandingContent;
use App\Settings\AppSettings;
use App\Support\Seo\SeoHead;
use App\Support\Sites\CurrentSite;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The home URL. Shows the landing page when it is switched on; otherwise sends visitors on.
 */
class HomeController extends Controller
{
    public function show(Request $request, AppSettings $settings, FeatureRegistry $features): Response|RedirectResponse
    {
        $current = app(CurrentSite::class);

        // The landing page is the default site's. Any other site shows the page it chose as its home, or the blog.
        if (! $current->isDefault()) {
            if ($current->site()->homeSlug() !== null) {
                return to_route('pages.show', $current->site()->homeSlug());
            }

            abort_unless($features->isEnabled('blog'), 404);

            return to_route('blog.index');
        }

        if (! $features->isEnabled('landing')) {
            return $request->user()
                ? to_route('dashboard')
                : to_route('login');
        }

        return Inertia::render('welcome', [
            'blocks' => self::blocks($settings->landing_published ?? LandingBlocks::defaults(), $features),
            'theme' => $settings->landing_theme ?? LandingBlocks::defaultTheme(),
            'preview' => false,
            'seo' => SeoHead::for(title: $settings->app_name, canonical: url('/')),
        ]);
    }

    /**
     * The blocks as the public page shows them: saved calls to action and the latest posts are filled in.
     *
     * @param  list<array{id: string, type: string, data: array<string, mixed>}>  $blocks
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    public static function blocks(array $blocks, FeatureRegistry $features): array
    {
        return LandingContent::apply($blocks, $features);
    }
}
