<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Cms\Content\Homepage;
use App\Cms\Menus\MenuRepository;
use App\Cms\Sections\SectionRegistry;
use App\Cms\Themes\ThemeManager;
use App\Models\Page;
use App\Models\PageSlug;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * Renders the public site.
 *
 * The Inertia component is not hardcoded: the active theme declares which one
 * renders a page, and a broken or missing theme falls back to the core
 * renderer inside ThemeManager, so the site never white-screens.
 */
class PublicPageController extends Controller
{
    public function __construct(
        private readonly SectionRegistry $sections,
        private readonly ThemeManager $themes,
        private readonly MenuRepository $menus,
        private readonly Homepage $homepage,
    ) {}

    /**
     * `/` renders the page named by the `content.homepage_slug` setting.
     *
     * The decision is made in one place, so the same database always produces
     * the same homepage: a configured-but-unpublished page leaves the core
     * landing page in place instead of silently switching between the theme and
     * the starter page depending on residual rows.
     */
    public function home(): HttpResponse|Response
    {
        $page = $this->homepage->page();

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

        return Inertia::render($this->themes->component('not_found'), $this->shell())
            ->toResponse(request())
            ->setStatusCode(404);
    }

    /**
     * Signed, unlisted preview of a draft. Same theme, plus a banner.
     */
    public function preview(Page $page): Response
    {
        return Inertia::render('preview/page', $this->shell() + [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'status' => $page->status,
                'content' => $page->content,
                'seo_title' => $page->seo_title,
                'seo_description' => $page->seo_description,
            ],
            'sections' => $this->sectionSchema(),
            'section_data' => $this->sectionData($page->content),
            'edit_url' => auth()->check() ? route('admin.pages.edit', $page) : null,
        ]);
    }

    private function render(Page $page): Response
    {
        return Inertia::render($this->themes->component('page'), $this->shell() + [
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
            'sections' => $this->sectionSchema(),
            'section_data' => $this->sectionData($page->content),
        ]);
    }

    /**
     * Everything the scene needs besides the page itself: tokens, chrome and
     * the menus. Shared by the page, the 404 and the preview.
     *
     * @return array<string, mixed>
     */
    private function shell(): array
    {
        return [
            'site' => [
                'name' => (string) config('lattice.site.name'),
                'tagline' => (string) config('lattice.site.tagline'),
                'description' => (string) config('lattice.site.description'),
                'home_url' => url('/'),
                'year' => (int) now()->year,
            ],
            'theme' => $this->themeProps(),
            'menus' => $this->menus->forSite(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function themeProps(): array
    {
        $active = $this->themes->activeTheme();

        return [
            'handle' => $active['handle'] ?? 'core',
            'name' => $active['name'] ?? 'Core',
            'tokens' => $this->themes->tokens(),
            'degraded' => $active['degraded'] ?? false,
        ];
    }

    /**
     * Render data for sections that need server state (PostCraft's teaser, for
     * example). Keyed by block id; the section supplies its own resolver.
     *
     * @return array<string, array<string, mixed>>
     */
    private function sectionData(mixed $content): array
    {
        if (! is_array($content)) {
            return [];
        }

        $data = [];

        foreach ($content as $block) {
            if (! is_array($block) || ! is_string($block['section'] ?? null)) {
                continue;
            }

            $section = $this->sections->find($block['section']);

            if ($section === null || ! $section->hasData()) {
                continue;
            }

            $resolved = $section->resolveData();
            $id = $block['id'] ?? null;

            if ($resolved !== null && is_string($id)) {
                $data[$id] = $resolved;
            }
        }

        return $data;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function sectionSchema(): array
    {
        return collect($this->sections->all())
            ->map(fn ($section): array => $section->toArray())
            ->values()
            ->all();
    }
}
