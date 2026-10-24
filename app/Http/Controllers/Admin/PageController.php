<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Pages\PageRepository;
use App\Cms\Pages\Slugger;
use App\Cms\Sections\SectionRegistry;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePageRequest;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Page;
use App\Models\PageRevision;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(
        private readonly PageRepository $pages,
        private readonly SectionRegistry $sections,
        private readonly Slugger $slugs,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Page::class);

        $filters = [
            'q' => trim((string) $request->query('q', '')),
            'status' => (string) $request->query('status', ''),
            'sort' => (string) $request->query('sort', 'updated'),
        ];

        $query = Page::query()
            ->with('author:id,name')
            ->when($request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
            ->when($filters['q'] !== '', fn ($query) => $query->where(function ($query) use ($filters): void {
                $query->where('title', 'like', "%{$filters['q']}%")
                    ->orWhere('slug', 'like', "%{$filters['q']}%");
            }))
            ->when(
                $filters['status'] !== '' && in_array($filters['status'], Page::STATUSES, true),
                fn ($query) => $query->where('status', $filters['status']),
            )
            ->when(! $request->boolean('trashed'), fn ($query) => $query->orderBy(...match ($filters['sort']) {
                'title' => ['title', 'asc'],
                'created' => ['created_at', 'desc'],
                default => ['updated_at', 'desc'],
            }));

        $pages = $query->paginate(20)->withQueryString()->through(fn (Page $page): array => $this->row($page));

        return Inertia::render('admin/pages/index', [
            'pages' => $pages,
            'filters' => [...$filters, 'trashed' => $request->boolean('trashed')],
            'counts' => $this->counts(),
            'can' => [
                'create' => $request->user()?->can('pages.create') ?? false,
                'publish' => $request->user()?->can('pages.publish') ?? false,
                'delete' => $request->user()?->can('pages.delete') ?? false,
            ],
        ]);
    }

    /**
     * One grouped query for the status strip instead of one per badge.
     *
     * @return array{all: int, draft: int, scheduled: int, published: int, trashed: int}
     */
    private function counts(): array
    {
        $byStatus = Page::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $trashed = Page::onlyTrashed()->count();

        $count = fn (string $status): int => (int) $byStatus->get($status, 0);

        return [
            'all' => (int) $byStatus->sum(),
            'draft' => $count(Page::STATUS_DRAFT),
            'scheduled' => $count(Page::STATUS_SCHEDULED),
            'published' => $count(Page::STATUS_PUBLISHED),
            'trashed' => $trashed,
        ];
    }

    public function create(): Response
    {
        $this->authorize('create', Page::class);

        return Inertia::render('admin/pages/edit', [
            'page' => null,
            'sections' => $this->sections->list(),
            'draft' => [
                'title' => '',
                'slug' => '',
                'excerpt' => '',
                'seo_title' => '',
                'seo_description' => '',
                'robots' => 'index,follow',
                'template' => 'page',
                'content' => $this->sections->blankPage(),
            ],
            'urls' => [
                'store' => route('admin.pages.store'),
            ],
            'can' => [
                'publish' => request()->user()?->can('pages.publish') ?? false,
            ],
        ]);
    }

    public function store(StorePageRequest $request): RedirectResponse
    {
        $page = $this->pages->create($request->user(), $request->validated());

        activity('pages')->performedOn($page)->event('created')->log('Created page "'.$page->title.'"');

        return redirect()
            ->route('admin.pages.edit', $page)
            ->with('toast', ['type' => 'success', 'message' => 'Page created.']);
    }

    public function edit(Request $request, Page $page): Response
    {
        $this->authorize('view', $page);

        return Inertia::render('admin/pages/edit', [
            'page' => $this->row($page) + [
                'excerpt' => $page->excerpt,
                'seo_title' => $page->seo_title,
                'seo_description' => $page->seo_description,
                'robots' => $page->robots,
                'template' => $page->template,
                'content' => $page->content,
                'scheduled_at' => $page->scheduled_at?->toIso8601String(),
                'published_at' => $page->published_at?->toIso8601String(),
            ],
            'sections' => $this->sections->list(),
            'revisions' => $page->revisions()->with('user:id,name')->limit(20)->get()->map(fn (PageRevision $revision): array => [
                'id' => $revision->id,
                'label' => $revision->label,
                'title' => $revision->title,
                'user' => $revision->user?->name,
                'created_at' => $revision->created_at?->toIso8601String(),
                'restore_url' => route('admin.pages.revisions.restore', [$page, $revision]),
            ]),
            'urls' => [
                'update' => route('admin.pages.update', $page),
                'autosave' => route('admin.pages.autosave', $page),
                'publish' => route('admin.pages.publish', $page),
                'unpublish' => route('admin.pages.unpublish', $page),
                'schedule' => route('admin.pages.schedule', $page),
                'preview' => URL::temporarySignedRoute(
                    'preview.pages.show',
                    now()->addHours(6),
                    ['page' => $page],
                ),
                'duplicate' => route('admin.pages.duplicate', $page),
                'destroy' => route('admin.pages.destroy', $page),
            ],
            'can' => [
                'update' => $request->user()?->can('update', $page) ?? false,
                'publish' => $request->user()?->can('publish', $page) ?? false,
                'delete' => $request->user()?->can('delete', $page) ?? false,
            ],
        ]);
    }

    public function update(UpdatePageRequest $request, Page $page): RedirectResponse
    {
        $this->pages->update(
            $page,
            $request->safe()->except('base_version'),
            $request->user(),
            baseVersion: $request->integer('base_version') ?: null,
        );

        activity('pages')->performedOn($page)->event('updated')->log('Updated page "'.$page->title.'"');

        return back()->with('toast', ['type' => 'success', 'message' => 'Changes saved.']);
    }

    /**
     * Autosave: quiet, no flash message, no redirect. Returns the new version
     * so the editor can tell whether someone else saved in the meantime.
     */
    public function autosave(UpdatePageRequest $request, Page $page): JsonResponse
    {
        $this->pages->update(
            $page,
            $request->safe()->except('base_version'),
            $request->user(),
            'Autosaved',
            $request->integer('base_version') ?: null,
        );

        return response()->json([
            'saved_at' => now()->toIso8601String(),
            'version' => $page->refresh()->version,
            'slug' => $page->slug,
        ]);
    }

    public function publish(Request $request, Page $page): RedirectResponse
    {
        $this->authorize('publish', $page);

        $this->pages->publish($page, $request->user());

        activity('pages')->performedOn($page)->event('published')->log('Published "'.$page->title.'"');

        return back()->with('toast', ['type' => 'success', 'message' => 'Page published.']);
    }

    public function unpublish(Request $request, Page $page): RedirectResponse
    {
        $this->authorize('publish', $page);

        $this->pages->unpublish($page, $request->user());

        activity('pages')->performedOn($page)->event('unpublished')->log('Unpublished "'.$page->title.'"');

        return back()->with('toast', ['type' => 'success', 'message' => 'Page moved back to draft.']);
    }

    public function schedule(Request $request, Page $page): RedirectResponse
    {
        $this->authorize('publish', $page);

        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);

        $this->pages->schedule($page, Carbon::parse($validated['scheduled_at']), $request->user());

        activity('pages')->performedOn($page)->event('scheduled')->log('Scheduled "'.$page->title.'"');

        return back()->with('toast', ['type' => 'success', 'message' => 'Page scheduled.']);
    }

    public function duplicate(Request $request, Page $page): RedirectResponse
    {
        $this->authorize('create', Page::class);

        $copy = $this->pages->duplicate($page, $request->user());

        return redirect()
            ->route('admin.pages.edit', $copy)
            ->with('toast', ['type' => 'success', 'message' => 'Page duplicated.']);
    }

    public function destroy(Request $request, Page $page): RedirectResponse
    {
        $this->authorize('delete', $page);

        $page->delete();

        activity('pages')->performedOn($page)->event('trashed')->log('Moved "'.$page->title.'" to trash');

        return back()->with('toast', ['type' => 'success', 'message' => 'Page moved to trash.']);
    }

    public function restore(Request $request, int $page): RedirectResponse
    {
        $model = Page::onlyTrashed()->findOrFail($page);

        $this->authorize('restore', $model);

        $model->restore();

        activity('pages')->performedOn($model)->event('restored')->log('Restored "'.$model->title.'"');

        return back()->with('toast', ['type' => 'success', 'message' => 'Page restored.']);
    }

    public function restoreRevision(Request $request, Page $page, PageRevision $revision): RedirectResponse
    {
        $this->authorize('update', $page);

        abort_unless($revision->page_id === $page->id, 404);

        $this->pages->restoreRevision($page, $revision, $request->user());

        return back()->with('toast', ['type' => 'success', 'message' => 'Revision restored.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Page $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'status' => $page->status,
            'author' => $page->author?->name,
            'is_trashed' => $page->trashed(),
            'published_at' => $page->published_at?->toIso8601String(),
            'scheduled_at' => $page->scheduled_at?->toIso8601String(),
            'updated_at' => $page->updated_at?->toIso8601String(),
            'version' => $page->version,
            'has_content' => is_array($page->content) && $page->content !== [],
            'urls' => [
                'edit' => route('admin.pages.edit', $page),
                'publish' => route('admin.pages.publish', $page),
                'unpublish' => route('admin.pages.unpublish', $page),
                'preview' => URL::temporarySignedRoute(
                    'preview.pages.show',
                    now()->addHours(6),
                    ['page' => $page],
                ),
                'duplicate' => route('admin.pages.duplicate', $page),
                'destroy' => route('admin.pages.destroy', $page),
                'restore' => route('admin.pages.restore', $page->id),
                'public' => $page->isPubliclyVisible() ? url($page->slug) : null,
            ],
        ];
    }
}
