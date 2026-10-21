<?php

namespace App\Features\Cms\Http\Controllers\Admin;

use App\Features\Cms\Http\Requests\TermRequest;
use App\Features\Cms\Models\Term;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Categories and tags, shared by every content type that supports them.
 */
class TermController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/cms/terms/index', [
            'terms' => Term::query()->withCount('entries')->orderBy('taxonomy')->orderBy('name')->get()->map(fn (Term $term) => [
                'id' => $term->id,
                'taxonomy' => $term->taxonomy,
                'name' => $term->name,
                'slug' => $term->slug,
                'entriesCount' => $term->entries_count,
            ])->values(),
        ]);
    }

    public function store(TermRequest $request): RedirectResponse
    {
        Term::query()->create($this->attributes($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Term created.')]);

        return back();
    }

    public function update(TermRequest $request, Term $term): RedirectResponse
    {
        $term->update($this->attributes($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Term saved.')]);

        return back();
    }

    public function destroy(Term $term): RedirectResponse
    {
        $term->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Term deleted.')]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(TermRequest $request): array
    {
        $validated = $request->validated();

        return [
            'taxonomy' => $validated['taxonomy'],
            'name' => $validated['name'],
            'slug' => filled($validated['slug'] ?? null) ? $validated['slug'] : Str::slug($validated['name']),
        ];
    }
}
