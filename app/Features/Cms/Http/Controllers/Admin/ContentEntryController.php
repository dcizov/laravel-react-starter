<?php

namespace App\Features\Cms\Http\Controllers\Admin;

use App\Features\Cms\Http\Requests\ContentEntryRequest;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Models\Term;
use App\Features\Cms\Support\ContentBlocks;
use App\Features\Cms\Support\ContentPresenter;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Creates, edits and deletes entries of any content type: pages, posts and custom post types.
 */
class ContentEntryController extends Controller
{
    public function index(string $type): Response
    {
        $contentType = $this->typeOrFail($type);

        $entries = ContentEntry::query()
            ->where('content_type', $contentType->key)
            ->with('author:id,name')
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/content/index', [
            'type' => ContentTypeController::payload($contentType),
            'entries' => $entries->through(fn (ContentEntry $entry) => [
                'id' => $entry->id,
                'title' => $entry->title,
                'slug' => $entry->slug,
                'status' => $entry->status,
                'live' => $entry->isLive(),
                'publishedAt' => $entry->published_at?->toIso8601String(),
                'updatedAt' => $entry->updated_at?->toIso8601String(),
                'author' => $entry->author?->name,
            ]),
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

        $this->fill($entry, $contentType, $request);
        $entry->save();

        $this->syncTerms($entry, $contentType, $request->validated('term_ids', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name created.', ['name' => $contentType->singular_label])]);

        return to_route('admin.content.edit', [$contentType->key, $entry]);
    }

    public function edit(string $type, ContentEntry $entry): Response
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);

        return $this->form($contentType, $entry);
    }

    public function update(ContentEntryRequest $request, string $type, ContentEntry $entry): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);

        $this->fill($entry, $contentType, $request);
        $entry->save();

        $this->syncTerms($entry, $contentType, $request->validated('term_ids', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name saved.', ['name' => $contentType->singular_label])]);

        return back();
    }

    public function destroy(string $type, ContentEntry $entry): RedirectResponse
    {
        $contentType = $this->typeOrFail($type);
        $this->belongsToType($entry, $contentType);

        $entry->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $contentType->singular_label])]);

        return to_route('admin.content.index', $contentType->key);
    }

    /**
     * Copies the validated input onto the entry. Fields the content type does not support are cleared.
     */
    private function fill(ContentEntry $entry, ContentType $type, ContentEntryRequest $request): void
    {
        $validated = $request->validated();

        $slug = trim((string) ($validated['slug'] ?? ''));

        if ($slug === '') {
            $slug = $this->uniqueSlug($type->key, Str::slug($validated['title']) ?: 'entry', $entry->id);
        }

        $status = $validated['status'];
        $publishedAt = filled($validated['published_at'] ?? null) ? Carbon::parse($validated['published_at']) : null;

        // Publishing without a date publishes now, so the entry appears straight away.
        if ($status === ContentEntry::STATUS_PUBLISHED && $publishedAt === null && $entry->published_at === null) {
            $publishedAt = now();
        }

        $customFields = [];

        foreach ($type->fields ?? [] as $field) {
            $customFields[$field['key']] = $validated['custom_fields'][$field['key']] ?? null;
        }

        $entry->fill([
            'title' => $validated['title'],
            'slug' => $slug,
            'excerpt' => $type->supports(ContentType::SUPPORT_EXCERPT) ? ($validated['excerpt'] ?? null) : null,
            'featured_image' => $type->supports(ContentType::SUPPORT_IMAGE) ? ($validated['featured_image'] ?? null) : null,
            'status' => $status,
            'published_at' => $publishedAt ?? $entry->published_at,
            'body' => ContentBlocks::validate($request->input('blocks', [])),
            'custom_fields' => $customFields,
            'seo' => array_filter([
                'title' => $validated['seo']['title'] ?? null,
                'description' => $validated['seo']['description'] ?? null,
                'noindex' => (bool) ($validated['seo']['noindex'] ?? false),
            ], fn ($value) => $value !== null && $value !== ''),
        ]);
    }

    /**
     * Keeps only the terms of the taxonomies this type supports.
     *
     * @param  list<int>  $termIds
     */
    private function syncTerms(ContentEntry $entry, ContentType $type, array $termIds): void
    {
        $allowed = collect([
            $type->supports(ContentType::SUPPORT_CATEGORY) ? Term::CATEGORY : null,
            $type->supports(ContentType::SUPPORT_TAG) ? Term::TAG : null,
        ])->filter()->all();

        $ids = Term::query()
            ->whereIn('id', $termIds)
            ->whereIn('taxonomy', $allowed)
            ->pluck('id')
            ->all();

        $entry->terms()->sync($ids);
    }

    private function uniqueSlug(string $type, string $base, ?int $ignoreId): string
    {
        $slug = $base;
        $suffix = 2;

        while (ContentEntry::query()
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
        return Inertia::render('admin/content/form', [
            'type' => ContentTypeController::payload($type),
            'entry' => $entry ? ContentPresenter::editable($entry) : null,
            'terms' => Term::query()->orderBy('name')->get(['id', 'taxonomy', 'name'])->map(fn (Term $term) => [
                'id' => $term->id,
                'taxonomy' => $term->taxonomy,
                'name' => $term->name,
            ])->values(),
            'ctas' => \App\Features\Cms\Models\Cta::query()->orderBy('name')->get(['id', 'name', 'heading'])->values(),
            'statuses' => ContentEntry::STATUSES,
        ]);
    }

    /**
     * Stores an image for a featured image or an image block. PNG, JPEG and WebP only. SVG is excluded because it can carry scripts.
     */
    public function storeImage(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ]);

        $path = $request->file('image')->store('content', 'public');

        return response()->json(['url' => \Illuminate\Support\Facades\Storage::disk('public')->url($path)]);
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
