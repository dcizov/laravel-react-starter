<?php

namespace App\Http\Controllers;

use App\Settings\AppSettings;
use App\Support\LandingBlocks;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The home URL. Shows the landing page when it is switched on; otherwise sends visitors on.
 */
class HomeController extends Controller
{
    public function show(Request $request, AppSettings $settings): Response|RedirectResponse
    {
        if (! $settings->landing_enabled) {
            return $request->user()
                ? to_route('dashboard')
                : to_route('login');
        }

        return Inertia::render('welcome', [
            'blocks' => $settings->landing_published ?? LandingBlocks::defaults(),
            'preview' => false,
        ]);
    }
}
