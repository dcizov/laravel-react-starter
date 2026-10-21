<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Settings\AppSettings;
use App\Support\LandingBlocks;
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
    public function index(AppSettings $settings): Response
    {
        return Inertia::render('admin/landing', [
            'draft' => $this->draftOf($settings),
            'published' => $settings->landing_published ?? LandingBlocks::defaults(),
            'hasDraft' => $settings->landing_draft !== null,
            'blockTypes' => LandingBlocks::TYPES,
        ]);
    }

    public function saveDraft(Request $request, AppSettings $settings): RedirectResponse
    {
        $settings->landing_draft = LandingBlocks::validate($request->input('blocks'));
        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Draft saved.')]);

        return back();
    }

    public function publish(AppSettings $settings): RedirectResponse
    {
        $settings->landing_published = $this->draftOf($settings);
        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page published.')]);

        return back();
    }

    public function discard(AppSettings $settings): RedirectResponse
    {
        $settings->landing_draft = $settings->landing_published;
        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Draft replaced with the published page.')]);

        return back();
    }

    /**
     * The draft, rendered with the public page's layout. Only admins can open it.
     */
    public function preview(AppSettings $settings): Response
    {
        return Inertia::render('welcome', [
            'blocks' => $this->draftOf($settings),
            'preview' => true,
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
}
