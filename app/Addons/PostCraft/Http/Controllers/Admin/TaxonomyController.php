<?php

declare(strict_types=1);

namespace App\Addons\PostCraft\Http\Controllers\Admin;

use App\Addons\PostCraft\Models\Category;
use App\Addons\PostCraft\Models\Tag;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Categories and tags share one screen because they are the same shape: a name,
 * a slug and a count of what uses them.
 */
class TaxonomyController
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $this->authorize('posts.view');

        return Inertia::render('posts/taxonomy', [
            'categories' => Category::query()
                ->withCount('posts')
                ->orderBy('name')
                ->get()
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'posts' => $category->posts_count,
                    'urls' => [
                        'update' => route('postcraft.admin.categories.update', $category),
                        'destroy' => route('postcraft.admin.categories.destroy', $category),
                    ],
                ]),
            'tags' => Tag::query()
                ->withCount('posts')
                ->orderBy('name')
                ->get()
                ->map(fn (Tag $tag): array => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                    'posts' => $tag->posts_count,
                    'urls' => [
                        'update' => route('postcraft.admin.tags.update', $tag),
                        'destroy' => route('postcraft.admin.tags.destroy', $tag),
                    ],
                ]),
            'urls' => [
                'categories' => route('postcraft.admin.categories.store'),
                'tags' => route('postcraft.admin.tags.store'),
                'posts' => route('postcraft.admin.posts.index'),
            ],
            'can' => ['update' => $request->user()?->can('posts.update') ?? false],
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $this->authorize('posts.update');

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'description' => ['nullable', 'string', 'max:200'],
        ]);

        Category::query()->create([
            'name' => $data['name'],
            'slug' => Category::uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('toast', ['type' => 'success', 'message' => 'Category created.']);
    }

    public function updateCategory(Request $request, Category $category): RedirectResponse
    {
        $this->authorize('posts.update');

        $data = $request->validate(['name' => ['required', 'string', 'min:2', 'max:60']]);

        $category->fill([
            'name' => $data['name'],
            'slug' => Category::uniqueSlug($data['name'], $category->id),
        ])->save();

        return back()->with('toast', ['type' => 'success', 'message' => 'Category renamed.']);
    }

    public function destroyCategory(Category $category): RedirectResponse
    {
        $this->authorize('posts.update');

        // Posts keep existing; they simply become uncategorised.
        $category->delete();

        return back()->with('toast', ['type' => 'success', 'message' => 'Category deleted.']);
    }

    public function storeTag(Request $request): RedirectResponse
    {
        $this->authorize('posts.update');

        $data = $request->validate(['name' => ['required', 'string', 'min:1', 'max:40']]);

        Tag::query()->create([
            'name' => $data['name'],
            'slug' => Tag::uniqueSlug($data['name']),
        ]);

        return back()->with('toast', ['type' => 'success', 'message' => 'Tag created.']);
    }

    public function updateTag(Request $request, Tag $tag): RedirectResponse
    {
        $this->authorize('posts.update');

        $data = $request->validate(['name' => ['required', 'string', 'min:1', 'max:40']]);

        $tag->fill([
            'name' => $data['name'],
            'slug' => Tag::uniqueSlug($data['name'], $tag->id),
        ])->save();

        return back()->with('toast', ['type' => 'success', 'message' => 'Tag renamed.']);
    }

    public function destroyTag(Tag $tag): RedirectResponse
    {
        $this->authorize('posts.update');

        $tag->delete();

        return back()->with('toast', ['type' => 'success', 'message' => 'Tag deleted.']);
    }
}
