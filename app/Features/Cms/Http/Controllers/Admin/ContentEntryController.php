<?php

namespace App\Features\Cms\Http\Controllers\Admin;

use App\Features\Cms\Http\Requests\ContentEntryRequest;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentEntryRevision;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Models\Cta;
use App\Features\Cms\Models\Term;
use App\Features\Cms\Support\ContentBlocks;
use App\Features\Cms\Support\ContentPresenter;
use App\Features\Cms\Support\EntryListing;
use App\Features\FeatureRegistry;
use App\Http\Controllers\Controller;
use App\Support\Rbac;
use App\Support\Sites\CurrentSite;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Creates, edits, trashes and restores entries of any content type: pages, posts and custom post types.
 *
 * Every change is checked against App\Features\Cms\Policies\ContentEntryPolicy. A change to an entry saves its
 * previous state as a revision first, so it can be restored later.
 */
class ContentEntryController extends Controller
{
    use AuthorizesRequests;

    /** The statuses the list can filter by. "scheduled" is a published entry whose date is in the future. */
    private const FILTERS = ['all', 'draft', 'published', 'scheduled', 'trashed'];

    /** Columns the list can sort by. Sorting by author is not offered, because it would need a join. */
    private const SORTS = ['title', 'status', 'published_at', 'updated_at'];

    private const PER_PAGE = [10, 20, 30, 50];

    private const BULK_ACTIONS = ['trash', 'restore', 'publish', 'draft', 'forceDelete'];

    public function index(Request $request, string $type): Response
    {
        $contentType = $this->typeOrFail($type);
        $user = $request->user();
        $filter = $this->filterOf($request);
        $query = $this->listQuery($request, $contentType, $filter);

        $perPage = in_array((int) $request->query('per_page'), self::PER_PAGE, true) ? (int) $request->query('per_page') : 20;
        $sort = in_array($request->query('sort'), self::SORTS, true) ? $request->query('sort') : 'updated_at';
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';

        $entries = (clone $query)
            ->with('author:id,name')
            ->orderBy($sort, $direction)
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/content/index', [
            'type' => ContentTypeController::payload($contentType),
            'entries' => $entries->through(fn (ContentEntry $entry) => [
                'id' => $entry->id,
                'title' => $entry->title,
                'slug' => $entry->slug,
                'status' => $entry->status,
                'scheduled' => $entry->status === ContentEntry::STATUS_PUBLISHED && ! $entry->isLive(),
                'live' => $entry->isLive(),
                'trashed' => $entry->trashed(),
                'publishedAt' => $entry->published_at?->toIso8601String(),
                'updatedAt' => $entry->updated_at?->toIso8601String(),
                'author' => $entry->author?->name,
                'editUrl' => route('admin.content.edit', [$contentType->key, $entry->id]),
                'viewUrl' => $entry->isLive() ? ContentPresenter::publicUrlFor($entry) : null,
                'canEdit' => $user->can('update', $entry),
                'canDelete' => $user->can('delete', $entry),
            ]),
            'query' => [
                'q' => trim((string) $request->query('q', '')),
                'status' => $filter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
                'page' => $entries->currentPage(),
            ],
            'counts' => $this->counts($request, $contentType),
            'can' => [
                'create' => $user->can('create', ContentEntry::class),
                'publish' => $user->can('publish', ContentEntry::class),
                'delete' => $user->can('delete', new ContentEntry(['content_type' => $contentType->key])),
            ],
            'pageSizes' => self::PER_PAGE,
        ]);
    }

    public function create(string $type): Response
    {
        return $this->form($this->typeOrFail($type), null);
    }

    public function store(ContentEntryRequest $request, string $type): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);

        $entry = new ContentEntry;
        $entry->content_type = $contentType->key;
        $entry->author_id = $request->user()->id;

        $entry->fill($this->attributes($request, $contentType, null));
        $entry->save();

        $this->syncTerms($entry, $contentType, $request->validated('term_ids', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name created.', ['name' => $contentType->singular_label])]);

        return to_route('admin.content.edit', [$contentType->key, $entry]);
    }

    public function edit(string $type, ContentEntry $entry): Response
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);
        $this->authorize('view', $entry);

        return $this->form($contentType, $entry);
    }

    public function update(ContentEntryRequest $request, string $type, ContentEntry $entry): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);
        $this->authorize('update', $entry);
        $this->ensureNotTrashed($entry);

        $snapshot = ContentEntryRevision::snapshot($entry);
        $entry->fill($this->attributes($request, $contentType, $entry));

        $termIds = collect($request->validated('term_ids', []))->sort()->values()->all();
        $termsBefore = $entry->terms()->pluck('cms_terms.id')->sort()->values()->all();

        // Only a change to the content is worth a revision. Saving without changes creates none.
        if ($entry->isDirty() || $termIds !== $termsBefore) {
            ContentEntryRevision::store($entry, $snapshot, $request->user()->id);
        }

        $entry->save();

        $this->syncTerms($entry, $contentType, $request->validated('term_ids', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name saved.', ['name' => $contentType->singular_label])]);

        return back();
    }

    /**
     * Moves the entry to the trash. It stays in the database and can be restored.
     */
    public function destroy(string $type, ContentEntry $entry): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);
        $this->authorize('delete', $entry);

        $entry->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name moved to the trash.', ['name' => $contentType->singular_label])]);

        return to_route('admin.content.index', $contentType->key);
    }

    public function restore(string $type, ContentEntry $entry): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);
        $this->authorize('restore', $entry);

        abort_unless($entry->trashed(), 422);

        $entry->restore();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name restored.', ['name' => $contentType->singular_label])]);

        return back();
    }

    /**
     * Deletes a trashed entry for good, with its comments and revisions. Only trashed entries can be removed this way.
     */
    public function forceDestroy(string $type, ContentEntry $entry): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);
        $this->authorize('forceDelete', $entry);

        abort_unless($entry->trashed(), 422);

        $entry->forceDelete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted for good.', ['name' => $contentType->singular_label])]);

        return to_route('admin.content.index', [$contentType->key, 'status' => 'trashed']);
    }

    /**
     * Applies one action to several entries from the list. Nothing changes unless the admin may do it to every entry.
     */
    public function bulk(Request $request, string $type): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:'.implode(',', self::BULK_ACTIONS)],
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer'],
        ]);

        $entries = ContentEntry::query()
            ->withTrashed()
            ->where('content_type', $contentType->key)
            ->whereIn('id', $validated['ids'])
            ->get();

        abort_unless($entries->count() === count(array_unique($validated['ids'])), 404);

        $action = $validated['action'];
        $user = $request->user();

        foreach ($entries as $entry) {
            match ($action) {
                'trash' => $this->authorize('delete', $entry),
                'restore' => $this->authorize('restore', $entry),
                'forceDelete' => $this->authorize('forceDelete', $entry),
                'publish', 'draft' => $this->authorize('publish', ContentEntry::class) && $this->authorize('update', $entry),
            };
        }

        foreach ($entries as $entry) {
            match ($action) {
                'trash' => $entry->delete(),
                'restore' => $entry->trashed() ? $entry->restore() : null,
                'forceDelete' => $entry->trashed() ? $entry->forceDelete() : null,
                'publish' => $this->publishNow($entry, $user->id),
                'draft' => $this->moveToDraft($entry, $user->id),
            };
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':count entries updated.', ['count' => $entries->count()])]);

        return back();
    }

    /**
     * Restores an earlier version. The version being replaced is saved as a revision first, so this can be undone.
     */
    public function restoreRevision(Request $request, string $type, ContentEntry $entry, ContentEntryRevision $revision): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);
        $this->authorize('revisions', $entry);
        $this->ensureNotTrashed($entry);

        abort_unless($revision->entry_id === $entry->id, 404);

        $user = $request->user();
        $snapshot = ContentEntryRevision::snapshot($entry);

        ContentEntryRevision::store($entry, $snapshot, $user->id);

        // Without the publish permission, a revision cannot change whether the entry is live.
        $status = $user->can('publish', ContentEntry::class) ? $revision->status : $entry->status;

        $entry->fill([
            'title' => $revision->title,
            'slug' => $this->slugFor($contentType, $revision->slug, $entry->id),
            'excerpt' => $revision->excerpt,
            'body' => $revision->body ?? [],
            'featured_image' => $revision->featured_image,
            'status' => $status,
            'published_at' => $revision->published_at,
            'custom_fields' => $revision->custom_fields ?? [],
            'seo' => $revision->seo ?? [],
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('The earlier version has been restored.')]);

        return back();
    }

    /**
     * Shows an entry as it would look on the site, from the form's current values. Nothing is saved. The token
     * expires after 30 minutes and works only for the admin who made it.
     */
    public function preview(ContentEntryRequest $request, string $type): JsonResponse
    {
        $contentType = $this->typeOrFail($type);
        $this->authorize('create', ContentEntry::class);

        $attributes = $this->attributes($request, $contentType, null);
        $token = Str::random(40);

        Cache::put('cms-preview:'.$token, [
            'user_id' => $request->user()->id,
            'site_id' => app(CurrentSite::class)->id(),
            'type' => $contentType->key,
            'attributes' => [...$attributes, 'author_id' => $request->user()->id, 'content_type' => $contentType->key],
            'term_ids' => $request->validated('term_ids', []),
        ], now()->addMinutes(30));

        return response()->json([
            'url' => route('admin.content.preview.show', [$contentType->key, $token]),
        ]);
    }

    public function showPreview(Request $request, string $type, string $token): HttpResponse
    {
        $contentType = $this->typeOrFail($type);
        $payload = Cache::get('cms-preview:'.$token);

        abort_if($payload === null || $payload['user_id'] !== $request->user()->id || $payload['type'] !== $contentType->key, 404);
        abort_if($payload['site_id'] !== app(CurrentSite::class)->id(), 404);

        $entry = new ContentEntry($payload['attributes']);
        $entry->exists = false;
        $entry->id = 0;
        $entry->setRelation('terms', Term::query()->whereIn('id', $payload['term_ids'])->get());

        $page = $contentType->key === 'post' && $this->blogEnabled()
            ? [
                'component' => 'blog/show',
                'props' => [
                    'entry' => ContentPresenter::page($entry, $contentType),
                    'commentsEnabled' => false,
                    'comments' => [],
                ],
            ]
            : [
                'component' => 'content/entry',
                'props' => [
                    'entry' => ContentPresenter::page($entry, $contentType),
                    'commentsEnabled' => false,
                    'comments' => [],
                ],
            ];

        return Inertia::render($page['component'], [
            ...$page['props'],
            'preview' => true,
        ])->toResponse($request)->withHeaders(['X-Robots-Tag' => 'noindex, nofollow']);
    }

    /**
     * Stores an image for a featured image or an image block. PNG, JPEG and WebP only. SVG is excluded because it can carry scripts.
     */
    public function storeImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ]);

        $path = $request->file('image')->store('content', 'public');

        return response()->json(['url' => Storage::disk('public')->url($path)]);
    }

    /**
     * The entries of the list, with the filters and search applied. Authors see their own entries only, unless they can edit any.
     */
    private function listQuery(Request $request, ContentType $type, string $filter): Builder
    {
        $user = $request->user();
        $query = ContentEntry::query()->withTrashed()->where('content_type', $type->key);

        if (! $user->can(Rbac::PERMISSION_CONTENT_EDIT_ANY)) {
            $query->where('author_id', $user->id);
        }

        match ($filter) {
            'trashed' => $query->onlyTrashed(),
            'draft' => $query->where('status', ContentEntry::STATUS_DRAFT)->whereNull('deleted_at'),
            'published' => $query->whereNull('deleted_at')->live(),
            'scheduled' => $query->whereNull('deleted_at')
                ->where('status', ContentEntry::STATUS_PUBLISHED)
                ->where('published_at', '>', now()),
            default => $query->whereNull('deleted_at'),
        };

        $search = trim((string) $request->query('q', ''));

        if ($search !== '') {
            EntryListing::search($query, $search);
        }

        return $query;
    }

    /**
     * How many entries each filter would show, for the filter buttons. The search applies to every count.
     *
     * @return array<string, int>
     */
    private function counts(Request $request, ContentType $type): array
    {
        $counts = [];

        foreach (self::FILTERS as $filter) {
            $counts[$filter] = $this->listQuery($request, $type, $filter)->count();
        }

        return $counts;
    }

    private function filterOf(Request $request): string
    {
        $filter = (string) $request->query('status', 'all');

        return in_array($filter, self::FILTERS, true) ? $filter : 'all';
    }

    private function publishNow(ContentEntry $entry, int $userId): void
    {
        // A trashed entry is restored first, so it cannot go live from the trash.
        if ($entry->trashed() || $entry->status === ContentEntry::STATUS_PUBLISHED) {
            return;
        }

        ContentEntryRevision::store($entry, ContentEntryRevision::snapshot($entry), $userId);

        $entry->forceFill([
            'status' => ContentEntry::STATUS_PUBLISHED,
            'published_at' => $entry->published_at ?? now(),
        ])->save();
    }

    private function moveToDraft(ContentEntry $entry, int $userId): void
    {
        if ($entry->trashed() || $entry->status === ContentEntry::STATUS_DRAFT) {
            return;
        }

        ContentEntryRevision::store($entry, ContentEntryRevision::snapshot($entry), $userId);

        $entry->forceFill(['status' => ContentEntry::STATUS_DRAFT])->save();
    }

    /**
     * Builds the values to save from the validated input. Fields the content type does not support are cleared.
     *
     * @return array<string, mixed>
     */
    private function attributes(ContentEntryRequest $request, ContentType $type, ?ContentEntry $entry): array
    {
        $validated = $request->validated();

        $slug = trim((string) ($validated['slug'] ?? ''));

        if ($slug === '') {
            $slug = $this->uniqueSlug($type->key, Str::slug($validated['title']) ?: 'entry', $entry?->id);
        }

        $status = $validated['status'];
        $publishedAt = filled($validated['published_at'] ?? null) ? Carbon::parse($validated['published_at']) : null;

        // Publishing without a date publishes now, so the entry appears straight away.
        if ($status === ContentEntry::STATUS_PUBLISHED && $publishedAt === null && $entry?->published_at === null) {
            $publishedAt = now();
        }

        $customFields = [];

        foreach ($type->fields ?? [] as $field) {
            $customFields[$field['key']] = $validated['custom_fields'][$field['key']] ?? null;
        }

        return [
            'title' => $validated['title'],
            'slug' => $slug,
            'excerpt' => $type->supports(ContentType::SUPPORT_EXCERPT) ? ($validated['excerpt'] ?? null) : null,
            'featured_image' => $type->supports(ContentType::SUPPORT_IMAGE) ? ($validated['featured_image'] ?? null) : null,
            'status' => $status,
            'published_at' => $publishedAt ?? $entry?->published_at,
            'body' => ContentBlocks::validate($request->input('body', [])),
            'custom_fields' => $customFields,
            'seo' => array_filter([
                'title' => $validated['seo']['title'] ?? null,
                'description' => $validated['seo']['description'] ?? null,
                'noindex' => (bool) ($validated['seo']['noindex'] ?? false),
            ], fn ($value) => $value !== null && $value !== ''),
        ];
    }

    /**
     * Keeps only the terms that belong to this type, this site, and a taxonomy the type supports.
     *
     * @param  list<int>  $termIds
     */
    private function syncTerms(ContentEntry $entry, ContentType $type, array $termIds): void
    {
        $ids = Term::query()
            ->forType($type->key)
            ->whereIn('id', $termIds)
            ->whereIn('taxonomy', $this->taxonomiesOf($type))
            ->pluck('id')
            ->all();

        $entry->terms()->sync($ids);
    }

    /**
     * @return list<string>
     */
    private function taxonomiesOf(ContentType $type): array
    {
        return collect([
            $type->supports(ContentType::SUPPORT_CATEGORY) ? Term::CATEGORY : null,
            $type->supports(ContentType::SUPPORT_TAG) ? Term::TAG : null,
        ])->filter()->values()->all();
    }

    private function slugFor(ContentType $type, string $slug, int $entryId): string
    {
        return $this->uniqueSlug($type->key, $slug, $entryId);
    }

    /**
     * A slug that no entry of this site and type already has, trashed ones included.
     */
    private function uniqueSlug(string $type, string $base, ?int $ignoreId): string
    {
        $slug = $base;
        $suffix = 2;

        while (ContentEntry::query()
            ->withTrashed()
            ->where('content_type', $type)
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private function form(ContentType $type, ?ContentEntry $entry): Response
    {
        $user = request()->user();
        $probe = $entry ?? new ContentEntry(['content_type' => $type->key]);

        return Inertia::render('admin/content/form', [
            'type' => ContentTypeController::payload($type),
            'entry' => $entry ? ContentPresenter::editable($entry) : null,
            'terms' => Term::query()->forType($type->key)->whereIn('taxonomy', $this->taxonomiesOf($type))->orderBy('name')->get(['id', 'taxonomy', 'name'])->map(fn (Term $term) => [
                'id' => $term->id,
                'taxonomy' => $term->taxonomy,
                'name' => $term->name,
            ])->values(),
            'ctas' => Cta::query()->orderBy('name')->get(['id', 'name', 'heading'])->values(),
            'statuses' => ContentEntry::STATUSES,
            'trashed' => $entry?->trashed() ?? false,
            // Entry-level abilities are checked against the entry itself, or a new one when the entry does not exist yet.
            'can' => [
                'publish' => $user->can('publish', ContentEntry::class),
                'update' => $entry ? $user->can('update', $entry) : $user->can('create', ContentEntry::class),
                'delete' => $user->can('delete', $probe),
                'restore' => $user->can('restore', $probe),
                'forceDelete' => $user->can('forceDelete', $probe),
            ],
            'revisions' => $entry
                ? $entry->revisions()->with('author:id,name')->limit(20)->get()->map(fn (ContentEntryRevision $revision) => [
                    'id' => $revision->id,
                    'title' => $revision->title,
                    'status' => $revision->status,
                    'author' => $revision->author?->name,
                    'createdAt' => $revision->created_at?->toIso8601String(),
                ])->values()
                : [],
            'previewUrl' => route('admin.content.preview.store', $type->key),
        ]);
    }

    private function ensureNotTrashed(ContentEntry $entry): void
    {
        if ($entry->trashed()) {
            throw ValidationException::withMessages([
                'title' => __('This entry is in the trash. Restore it before you change it.'),
            ]);
        }
    }

    private function blogEnabled(): bool
    {
        return app(FeatureRegistry::class)->isEnabled('blog');
    }

    private function typeOrFail(string $key): ContentType
    {
        return ContentType::findByKey($key) ?? abort(404);
    }

    private function belongsToType(ContentEntry $entry, ContentType $type): void
    {
        abort_unless($entry->content_type === $type->key, 404);
    }
}
