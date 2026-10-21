<?php

namespace App\Features\Seo\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Settings\AppSettings;
use App\Features\Cms\Support\SafeUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The site-wide SEO settings.
 */
class SeoSettingsController extends Controller
{
    public function edit(AppSettings $settings): Response
    {
        return Inertia::render('admin/seo/index', [
            'seo' => [
                'siteName' => $settings->app_name,
                'description' => $settings->seo_description,
                'image' => $settings->seo_image,
                'allowIndexing' => $settings->seo_allow_indexing,
                'twitter' => $settings->seo_twitter,
            ],
            'sitemapUrl' => url('/sitemap.xml'),
            'robotsUrl' => url('/robots.txt'),
        ]);
    }

    public function update(Request $request, AppSettings $settings): RedirectResponse
    {
        $validated = $request->validate([
            'description' => ['nullable', 'string', 'max:300'],
            'image' => ['nullable', 'string', 'max:500', SafeUrl::rule()],
            'allow_indexing' => ['required', 'boolean'],
            'twitter' => ['nullable', 'string', 'max:16', 'regex:/^@?[A-Za-z0-9_]{1,15}$/'],
        ]);

        $settings->seo_description = filled($validated['description'] ?? null) ? trim($validated['description']) : null;
        $settings->seo_image = filled($validated['image'] ?? null) ? $validated['image'] : null;
        $settings->seo_allow_indexing = (bool) $validated['allow_indexing'];
        $settings->seo_twitter = filled($validated['twitter'] ?? null) ? ltrim($validated['twitter'], '@') : null;
        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('SEO settings saved.')]);

        return back();
    }
}
