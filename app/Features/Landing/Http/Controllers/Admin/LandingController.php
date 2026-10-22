<?php

namespace App\Features\Landing\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Features\FeatureRegistry;
use App\Http\Controllers\HomeController;
use App\Settings\AppSettings;
use App\Support\Seo\SeoHead;
use App\Features\Landing\LandingBlocks;
use App\Features\Landing\LandingContent;
use App\Features\Landing\LandingPresets;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The landing page editor. Changes are saved as a draft; publishing copies the draft to the public page.
 * Every route is behind landing.manage.
 */
class LandingController extends Controller
{
    public function index(AppSettings $settings, FeatureRegistry $features): Response
    {
        return Inertia::render('admin/landing', [
            'ctas' => $features->isEnabled('cms')
                ? \App\Features\Cms\Models\Cta::query()->orderBy('name')->get(['id', 'name', 'heading', 'text', 'button_label', 'button_url'])->values()
                : [],
            'draft' => $this->draftOf($settings),
            'theme' => $this->themeDraftOf($settings),
            // The latest-posts block is only offered while the blog is on.
            'blockTypes' => array_values(array_filter(
                LandingBlocks::TYPES,
                fn (string $type) => $type !== 'posts' || $features->isEnabled('blog'),
            )),
            // The newest posts, so the editor can show them in the preview the way the public page will.
            'latestPosts' => $features->isEnabled('blog') ? LandingContent::latest(LandingBlocks::MAX_POSTS) : [],
            'presets' => $this->presets(),
        ]);
    }

    public function saveDraft(Request $request, AppSettings $settings): RedirectResponse
    {
        // Both are checked before anything is saved, so a bad theme does not leave a half-saved draft.
        $blocks = LandingBlocks::validate($request->input('blocks'));
        $theme = LandingBlocks::validateTheme($request->input('theme'));

        $settings->landing_draft = $blocks;
        $settings->landing_theme_draft = $theme;
        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Draft saved.')]);

        return back();
    }

    public function publish(AppSettings $settings): RedirectResponse
    {
        $settings->landing_published = $this->draftOf($settings);
        $settings->landing_theme = $this->themeDraftOf($settings);
        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page published.')]);

        return back();
    }

    public function discard(AppSettings $settings): RedirectResponse
    {
        $settings->landing_draft = $settings->landing_published;
        $settings->landing_theme_draft = $settings->landing_theme;
        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Draft replaced with the published page.')]);

        return back();
    }

    /**
     * The draft, rendered with the public page's layout. Only admins can open it.
     */
    public function preview(AppSettings $settings, FeatureRegistry $features): Response
    {
        return Inertia::render('welcome', [
            'blocks' => HomeController::blocks($this->draftOf($settings), $features),
            'theme' => $this->themeDraftOf($settings),
            'preview' => true,
            // A draft must never be indexed.
            'seo' => [...SeoHead::for(title: $settings->app_name, canonical: null), 'noindex' => true],
        ]);
    }

    /**
     * Stores an image for a landing block and returns its public path. PNG, JPEG, and WebP only,
     * the same as the logo. SVG is excluded because it can carry scripts.
     */
    public function storeImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $path = $request->file('image')->store('landing', 'public');

        return response()->json(['url' => Storage::disk('public')->url($path)]);
    }

    /**
     * The draft if there is one, otherwise the published page, otherwise the built-in default.
     *
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    private function draftOf(AppSettings $settings): array
    {
        return $settings->landing_draft
            ?? $settings->landing_published
            ?? LandingBlocks::defaults();
    }

    /**
     * The theme draft if there is one, otherwise the published theme, otherwise the default theme.
     *
     * @return array<string, mixed>
     */
    private function themeDraftOf(AppSettings $settings): array
    {
        return $settings->landing_theme_draft
            ?? $settings->landing_theme
            ?? LandingBlocks::defaultTheme();
    }

    /**
     * The starting pages the editor offers. A preset without its own theme keeps the current one.
     *
     * @return list<array<string, mixed>>
     */
    private function presets(): array
    {
        return array_map(fn (array $preset) => [
            'key' => $preset['key'],
            'label' => $preset['label'],
            'description' => $preset['description'],
            'blocks' => $preset['blocks'],
            'theme' => $preset['theme'] ?? null,
        ], LandingPresets::all());
    }
}
