<?php

declare(strict_types=1);

namespace App\Addons\PostCraft\Http\Controllers;

use App\Addons\PostCraft\Models\Category;
use App\Addons\PostCraft\Models\Post;
use App\Addons\PostCraft\Models\Tag;
use App\Cms\Menus\MenuRepository;
use App\Cms\Themes\ThemeManager;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * The public blog. It renders through the active theme's tokens like the rest
 * of the site, so PostCraft never ships its own chrome.
 */
class BlogController
{
    public function __construct(
        private readonly ThemeManager $themes,
        private readonly MenuRepository $menus,
    ) {}

    public function index(): InertiaResponse
    {
        $posts = Post::query()
            ->published()
            ->with(['category:id,name,slug', 'author:id,name', 'featuredMedia'])
            ->orderByDesc('published_at')
            ->paginate(9)
            ->withQueryString()
            ->through(fn (Post $post): array => $this->card($post));

        return Inertia::render('blog/index', $this->shell() + [
            'posts' => $posts,
            // Only terms that actually have a live post: `whereHas` keeps this
            // portable (SQLite rejects a HAVING clause without a GROUP BY).
            'categories' => Category::query()
                ->whereHas('posts', fn ($query) => $query->published())
                ->withCount(['posts' => fn ($query) => $query->published()])
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'tags' => Tag::query()
                ->whereHas('posts', fn ($query) => $query->published())
                ->withCount(['posts' => fn ($query) => $query->published()])
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'feed_url' => route('postcraft.blog.feed'),
        ]);
    }

    public function show(string $slug): InertiaResponse|Response
    {
        $post = Post::query()->published()->with('featuredMedia')->where('slug', $slug)->first();

        if ($post === null) {
            return Inertia::render($this->themes->component('not_found'), $this->shell())
                ->toResponse(request())
                ->setStatusCode(404);
        }

        $related = Post::query()
            ->published()
            ->whereKeyNot($post->id)
            ->when($post->category_id !== null, fn ($query) => $query->where('category_id', $post->category_id))
            ->orderByDesc('published_at')
            ->limit(3)
            ->with('featuredMedia')
            ->get()
            ->map(fn (Post $other): array => $this->card($other));

        return Inertia::render('blog/show', $this->shell() + [
            'post' => $this->card($post) + [
                'blocks' => $post->blocks(),
                'body' => $post->body,
                'reading_minutes' => $post->readingMinutes(),
                'author' => $post->author?->name,
                'meta_description' => $post->excerpt,
            ],
            'related' => $related,
        ]);
    }

    /**
     * RSS 2.0 feed of the published posts.
     */
    public function feed(): Response
    {
        $posts = Post::query()
            ->published()
            ->orderByDesc('published_at')
            ->limit(30)
            ->get();

        $site = (string) config('lattice.site.name');

        $xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
        $xml[] = '<rss version="2.0"><channel>';
        $xml[] = '  <title>'.htmlspecialchars($site, ENT_XML1).'</title>';
        $xml[] = '  <link>'.htmlspecialchars(url('/blog'), ENT_XML1).'</link>';
        $xml[] = '  <description>'.htmlspecialchars((string) config('lattice.site.description'), ENT_XML1).'</description>';

        foreach ($posts as $post) {
            $xml[] = '  <item>';
            $xml[] = '    <title>'.htmlspecialchars($post->title, ENT_XML1).'</title>';
            $xml[] = '    <link>'.htmlspecialchars(url($post->url()), ENT_XML1).'</link>';
            $xml[] = '    <guid>'.htmlspecialchars(url($post->url()), ENT_XML1).'</guid>';
            $xml[] = '    <pubDate>'.$post->published_at?->toRfc2822String().'</pubDate>';
            $xml[] = '    <description>'.htmlspecialchars((string) $post->excerpt, ENT_XML1).'</description>';
            $xml[] = '  </item>';
        }

        $xml[] = '</channel></rss>';

        return response(implode("\n", $xml), 200, ['Content-Type' => 'application/rss+xml; charset=UTF-8']);
    }

    /**
     * @return array<string, mixed>
     */
    private function card(Post $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'url' => $post->url(),
            'published_at' => $post->published_at?->toIso8601String(),
            'published_label' => $post->published_at?->format('j F Y'),
            'category' => $post->category === null ? null : ['name' => $post->category->name, 'slug' => $post->category->slug],
            'tags' => $post->relationLoaded('tags') ? $post->tags->pluck('name')->all() : [],
            // The featured image is the post's only non-text content signal on
            // the index, so it travels with the card: url, alt and intrinsic
            // size (no layout shift), never the model.
            'image' => $post->featuredMedia === null ? null : [
                'url' => $post->featuredMedia->url(),
                'thumbnail_url' => $post->featuredMedia->thumbnailUrl(),
                'alt' => $post->featuredMedia->alt ?? $post->title,
                'width' => $post->featuredMedia->width,
                'height' => $post->featuredMedia->height,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function shell(): array
    {
        $active = $this->themes->activeTheme();

        return [
            'site' => [
                'name' => (string) config('lattice.site.name'),
                'tagline' => (string) config('lattice.site.tagline'),
                'description' => (string) config('lattice.site.description'),
                'home_url' => url('/'),
                'year' => (int) now()->year,
            ],
            'theme' => [
                'handle' => $active['handle'] ?? 'core',
                'name' => $active['name'] ?? 'Core',
                'tokens' => $this->themes->tokens(),
                'degraded' => $active['degraded'] ?? false,
            ],
            'menus' => $this->menus->forSite(),
        ];
    }
}
