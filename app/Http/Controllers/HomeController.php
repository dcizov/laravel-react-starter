<?php

namespace App\Http\Controllers;

use App\Features\FeatureRegistry;
use App\Features\Landing\LandingBlocks;
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
            'blocks' => $settings->landing_published ?? LandingBlocks::defaults(),
            'theme' => $settings->landing_theme ?? LandingBlocks::defaultTheme(),
            'preview' => false,
        ]);
    }
}
