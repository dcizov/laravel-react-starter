<?php

declare(strict_types=1);

namespace App\Addons\PostCraft\Http\Controllers\Admin;

use App\Addons\PostCraft\Models\Category;
use App\Addons\PostCraft\Models\Post;
use App\Addons\PostCraft\Models\Tag;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Post administration. PostCraft brings its own controller and its own
 * authorization (the `posts.*` permissions its manifest declares), so the core
 * knows nothing about it — deactivating the addon removes all of this.
 */
class PostController
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $this->authorize('posts.view');

        $search = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');

        $posts = Post::query()
            ->with(['author:id,name', 'category:id,name', 'tags:id,name', 'featuredMedia'])
            ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->when(in_array($status, Post::STATUSES, true), fn ($query) => $query->where('status', $status))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Post $post): array => $this->row($post));

        return Inertia::render('posts/index', [
            'posts' => $posts,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'counts' => [
                'all' => Post::query()->count(),
                'draft' => Post::query()->where('status', Post::STATUS_DRAFT)->count(),
                'published' => Post::query()->where('status', Post::STATUS_PUBLISHED)->count(),
            ],
            'filters' => ['q' => $search, 'status' => $status],
            'urls' => [
                'index' => route('postcraft.admin.posts.index'),
                'create' => route('postcraft.admin.posts.create'),
                'taxonomy' => route('postcraft.admin.taxonomy.index'),
            ],
            'can' => [
                'create' => $request->user()?->can('posts.create') ?? false,
                'publish' => $request->user()?->can('posts.publish') ?? false,
                'delete' => $request->user()?->can('posts.delete') ?? false,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('posts.create');

        return Inertia::render('posts/edit', [
            'post' => null,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'tags' => Tag::query()->orderBy('name')->get(['id', 'name']),
            'urls' => ['store' => route('postcraft.admin.posts.store')],
            'can' => ['publish' => $request->user()?->can('posts.publish') ?? false],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('posts.create');

        $data = $this->validated($request);
        $post = Post::query()->create($data + [
            'slug' => Post::uniqueSlug($data['title']),
            'author_id' => $request->user()?->id,
            'status' => Post::STATUS_DRAFT,
        ]);

        $post->tags()->sync($this->tagIds($request));

        activity('posts')->performedOn($post)->event('created')->log('Created post "'.$post->title.'"');

        return redirect()
            ->route('postcraft.admin.posts.edit', $post)
            ->with('toast', ['type' => 'success', 'message' => 'Post created.']);
    }

    public function edit(Request $request, Post $post): Response
    {
        $this->authorize('posts.view');

        $post->load('featuredMedia');

        return Inertia::render('posts/edit', [
            'post' => $this->row($post, detailed: true),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'tags' => Tag::query()->orderBy('name')->get(['id', 'name']),
            'urls' => [
                'update' => route('postcraft.admin.posts.update', $post),
                'publish' => route('postcraft.admin.posts.publish', $post),
                'unpublish' => route('postcraft.admin.posts.unpublish', $post),
                'destroy' => route('postcraft.admin.posts.destroy', $post),
                'public' => $post->isLive() ? $post->url() : null,
            ],
            'can' => [
                'publish' => $request->user()?->can('posts.publish') ?? false,
                'update' => $request->user()?->can('posts.update') ?? false,
            ],
        ]);
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('posts.update');

        $data = $this->validated($request);

        $post->fill($data)->save();
        $post->tags()->sync($this->tagIds($request));

        activity('posts')->performedOn($post)->event('updated')->log('Updated post "'.$post->title.'"');

        return back()->with('toast', ['type' => 'success', 'message' => 'Post saved.']);
    }

    public function publish(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('posts.publish');

        $post->forceFill([
            'status' => Post::STATUS_PUBLISHED,
            'published_at' => $post->published_at ?? now(),
        ])->save();

        return back()->with('toast', ['type' => 'success', 'message' => 'Post published.']);
    }

    public function unpublish(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('posts.publish');

        $post->forceFill(['status' => Post::STATUS_DRAFT])->save();

        return back()->with('toast', ['type' => 'success', 'message' => 'Post unpublished.']);
    }

    public function destroy(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('posts.delete');

        $post->delete();

        return redirect()
            ->route('postcraft.admin.posts.index')
            ->with('toast', ['type' => 'success', 'message' => 'Post moved to trash.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:180'],
            'excerpt' => ['nullable', 'string', 'max:300'],
            'body' => ['required', 'string', 'min:10'],
            'category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')],
            'featured_media_id' => ['nullable', 'integer', Rule::exists('media', 'id')],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    /**
     * @return list<int>
     */
    private function tagIds(Request $request): array
    {
        $ids = $request->input('tag_ids', []);

        if (! is_array($ids)) {
            return [];
        }

        return Tag::query()->whereIn('id', array_map('intval', $ids))->pluck('id')->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Post $post, bool $detailed = false): array
    {
        $row = [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'status' => $post->status,
            'excerpt' => $post->excerpt,
            'category' => $post->category?->name,
            'category_id' => $post->category_id,
            'tags' => $post->tags->pluck('name')->all(),
            'tag_ids' => $post->tags->pluck('id')->all(),
            'author' => $post->author?->name,
            'published_at' => $post->published_at?->toIso8601String(),
            'updated_at' => $post->updated_at?->toIso8601String(),
            'is_live' => $post->isLive(),
            'reading_minutes' => $post->readingMinutes(),
            'featured_image' => $post->featuredMedia === null ? null : [
                'id' => $post->featuredMedia->id,
                'url' => $post->featuredMedia->url(),
                'thumbnail_url' => $post->featuredMedia->thumbnailUrl(),
                'alt' => $post->featuredMedia->alt,
            ],
            'urls' => [
                'edit' => route('postcraft.admin.posts.edit', $post),
                'publish' => route('postcraft.admin.posts.publish', $post),
                'unpublish' => route('postcraft.admin.posts.unpublish', $post),
                'destroy' => route('postcraft.admin.posts.destroy', $post),
                'public' => $post->isLive() ? $post->url() : null,
            ],
        ];

        if ($detailed) {
            $row['body'] = $post->body;
            $row['published_at_input'] = $post->published_at?->format('Y-m-d\TH:i');
            $row['featured_media_id'] = $post->featured_media_id;
        }

        return $row;
    }
}
