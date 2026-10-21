<?php

namespace App\Features\Cms\Http\Controllers\Admin;

use App\Features\Cms\Http\Requests\ContentTypeRequest;
use App\Features\Cms\Models\ContentType;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The content types: pages, posts, and the custom post types an admin defines.
 */
class ContentTypeController extends Controller
{
    public function index(): Response
    {
        $types = ContentType::query()->withCount('entries')->orderBy('id')->get();

        return Inertia::render('admin/cms/types/index', [
            'types' => $types->map(fn (ContentType $type) => self::payload($type))->values(),
            'supports' => ContentType::SUPPORTS,
            'fieldTypes' => ContentType::FIELD_TYPES,
        ]);
    }

    public function store(ContentTypeRequest $request): RedirectResponse
    {
        ContentType::query()->create([
            ...$this->attributes($request),
            'key' => $request->validated('key'),
            'builtin' => false,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Content type created.')]);

        return back();
    }

    public function update(ContentTypeRequest $request, ContentType $contentType): RedirectResponse
    {
        $contentType->update($this->attributes($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Content type saved.')]);

        return back();
    }

    public function destroy(ContentType $contentType): RedirectResponse
    {
        if ($contentType->builtin) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Built-in content types cannot be deleted.')]);

            return back();
        }

        if ($contentType->entries()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Delete or move the entries of this type first.')]);

            return back();
        }

        $contentType->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Content type deleted.')]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(ContentTypeRequest $request): array
    {
        $validated = $request->validated();

        return [
            'label' => $validated['label'],
            'singular_label' => $validated['singular_label'],
            'has_archive' => (bool) ($validated['has_archive'] ?? false),
            'supports' => array_values(array_unique($validated['supports'])),
            'fields' => array_values(array_map(fn (array $field) => [
                'key' => $field['key'],
                'label' => $field['label'],
                'type' => $field['type'],
            ], $validated['fields'])),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function payload(ContentType $type): array
    {
        return [
            'id' => $type->id,
            'key' => $type->key,
            'label' => $type->label,
            'singular' => $type->singular_label,
            'hasArchive' => $type->has_archive,
            'supports' => $type->supports ?? [],
            'fields' => $type->fields ?? [],
            'builtin' => $type->builtin,
            'entriesCount' => $type->entries_count ?? $type->entries()->count(),
        ];
    }
}
