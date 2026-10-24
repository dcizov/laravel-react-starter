<?php

namespace App\Http\Controllers;

use App\Cms\Sections\SectionRegistry;
use App\Models\Page;
use App\Models\PageSlug;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * Renders published pages.
 *
 * Until the theme layer lands this is the plain core renderer, but the contract
 * is already the real one: drafts are never public, an old slug answers with a
 * permanent redirect instead of a 404.
 */
class PublicPageController extends Controller
{
    public function __construct(private readonly SectionRegistry $sections) {}

    public function home(): HttpResponse|Response
    {
        $page = Page::query()
            ->where('status', Page::STATUS_PUBLISHED)
            ->where('slug', 'home')
            ->first();

        if ($page === null) {
            return Inertia::render('welcome');
        }

        return $this->render($page);
    }

    public function show(string $slug): HttpResponse|Response
    {
        $page = Page::query()->where('slug', $slug)->first();

        if ($page !== null && $page->isPubliclyVisible()) {
            return $this->render($page);
        }

        // A slug the page used to have keeps working, permanently.
        $historical = PageSlug::query()->where('slug', $slug)->latest('id')->first();

        if ($historical !== null && $historical->page?->isPubliclyVisible()) {
            return redirect()->to('/'.$historical->page->slug, 301);
        }

        return Inertia::render('public/not-found')->toResponse(request())->setStatusCode(404);
    }

    /**
     * Signed, unlisted preview of a draft. No index, no cache.
     */
    public function preview(Page $page): Response
    {
        return Inertia::render('preview/page', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'status' => $page->status,
                'content' => $page->content,
                'seo_title' => $page->seo_title,
                'seo_description' => $page->seo_description,
            ],
            'sections' => collect($this->sections->all())->map(fn ($section): array => $section->toArray())->values(),
            'edit_url' => auth()->check() ? route('admin.pages.edit', $page) : null,
        ]);
    }

    private function render(Page $page): Response
    {
        return Inertia::render('public/page', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'excerpt' => $page->excerpt,
                'content' => $page->content,
                'seo_title' => $page->seo_title ?? $page->title,
                'seo_description' => $page->seo_description ?? $page->excerpt,
                'robots' => $page->robots,
                'published_at' => $page->published_at?->toIso8601String(),
                'updated_at' => $page->updated_at?->toIso8601String(),
            ],
            'sections' => collect($this->sections->all())->map(fn ($section): array => $section->toArray())->values(),
        ]);
    }
}
