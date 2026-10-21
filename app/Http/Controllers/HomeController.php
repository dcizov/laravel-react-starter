<?php

namespace App\Http\Controllers;

use App\Features\Cms\Support\CtaReference;
use App\Features\FeatureRegistry;
use App\Features\Landing\LandingBlocks;
use App\Support\Seo\SeoHead;
use App\Settings\AppSettings;
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
     * Saved calls to action only apply when the cms feature is on.
     *
     * @param  list<array{id: string, type: string, data: array<string, mixed>}>  $blocks
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    public static function blocks(array $blocks, FeatureRegistry $features): array
    {
        return $features->isEnabled('cms') ? CtaReference::apply($blocks) : $blocks;
    }
}
