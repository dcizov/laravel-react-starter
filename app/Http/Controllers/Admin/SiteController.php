<?php

namespace App\Http\Controllers\Admin;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\Cta;
use App\Features\Cms\Models\Term;
use App\Http\Controllers\Controller;
use App\Http\Middleware\ResolveSite;
use App\Http\Requests\Admin\SiteRequest;
use App\Models\Scopes\SiteScope;
use App\Models\Site;
use App\Support\Sites\CurrentSite;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sites: their names, addresses, languages and SEO defaults. The admin chooses which site to work on with the switcher.
 *
 * A site that still has content cannot be deleted, so no content is ever removed by accident. Move or delete the
 * content first.
 */
class SiteController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/sites/index', [
            'sites' => Site::query()
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get()
                ->map(fn (Site $site) => $this->present($site))
                ->values(),
            'locales' => Site::LOCALES,
        ]);
    }

    public function store(SiteRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $site = Site::query()->create($this->attributes($request, isNew: true));

            if ($request->boolean('is_default')) {
                $this->makeDefault($site);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Site created.')]);

        return back();
    }

    public function update(SiteRequest $request, Site $site): RedirectResponse
    {
        DB::transaction(function () use ($request, $site) {
            $site->update($this->attributes($request, isNew: false, site: $site));

            if ($request->boolean('is_default') && ! $site->isDefault()) {
                $this->makeDefault($site);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Site saved.')]);

        return back();
    }

    public function destroy(Site $site): RedirectResponse
    {
        if ($site->isDefault()) {
            throw ValidationException::withMessages([
                'site' => __('The default site cannot be deleted. Make another site the default first.'),
            ]);
        }

        if ($this->contentCount($site) > 0) {
            throw ValidationException::withMessages([
                'site' => __('This site still has content. Move or delete its pages, posts, categories, tags and calls to action first.'),
            ]);
        }

        $site->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Site deleted.')]);

        return back();
    }

    /**
     * Makes this site the one the admin works on. Stored in the session, so it lasts until the admin picks another.
     */
    public function switch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'site_id' => ['required', 'integer', 'exists:sites,id'],
        ]);

        $request->session()->put(ResolveSite::SESSION_KEY, (int) $validated['site_id']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(SiteRequest $request, bool $isNew, ?Site $site = null): array
    {
        $validated = $request->validated();

        return [
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'domain' => filled($validated['domain'] ?? null) ? strtolower($validated['domain']) : null,
            'locale' => $validated['locale'],
            'settings' => [
                'description' => $validated['description'] ?? null,
                'home_slug' => $validated['home_slug'] ?? null,
            ],
            // The default flag is changed through makeDefault(), so editing a site never drops it.
            ...($isNew ? ['is_default' => false] : []),
        ];
    }

    private function makeDefault(Site $site): void
    {
        Site::query()->where('is_default', true)->update(['is_default' => false]);
        $site->forceFill(['is_default' => true])->save();
    }

    private function contentCount(Site $site): int
    {
        return ContentEntry::query()->withoutGlobalScope(SiteScope::class)->withTrashed()->where('site_id', $site->id)->count()
            + Term::query()->withoutGlobalScope(SiteScope::class)->where('site_id', $site->id)->count()
            + Cta::query()->withoutGlobalScope(SiteScope::class)->where('site_id', $site->id)->count();
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Site $site): array
    {
        return [
            'id' => $site->id,
            'name' => $site->name,
            'slug' => $site->slug,
            'domain' => $site->domain,
            'locale' => $site->locale,
            'isDefault' => $site->isDefault(),
            'description' => $site->description(),
            'homeSlug' => $site->homeSlug(),
            'publicUrl' => $site->publicUrl(),
            'contentCount' => $this->contentCount($site),
            'current' => app(CurrentSite::class)->id() === $site->id,
        ];
    }
}
