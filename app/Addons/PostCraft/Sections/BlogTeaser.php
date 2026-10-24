<?php

namespace App\Addons\PostCraft\Sections;

use App\Addons\PostCraft\Models\Post;
use App\Cms\Sections\Field;
use App\Cms\Sections\Section;

/**
 * The section PostCraft contributes to every theme. Declared in PHP so the
 * editor, the validator and the renderer all read the same definition.
 */
final class BlogTeaser
{
    public static function make(): Section
    {
        return Section::make('blog-teaser', 'Blog teaser', [
            Field::text('heading', 'Heading', ['default' => 'From the journal']),
            Field::textarea('intro', 'Intro'),
            Field::number('limit', 'How many posts', ['default' => 3, 'rules' => ['integer', 'min:1', 'max:9']]),
        ], [
            'description' => 'The latest published posts, rendered by PostCraft.',
            'icon' => 'newspaper',
            // The core asks the registry for this data; PostCraft supplies it.
            'data' => fn (): array => [
                'posts' => Post::query()
                    ->published()
                    ->with('category:id,name')
                    ->orderByDesc('published_at')
                    ->limit(3)
                    ->get()
                    ->map(fn (Post $post): array => [
                        'id' => $post->id,
                        'title' => $post->title,
                        'excerpt' => $post->excerpt,
                        'url' => $post->url(),
                        'date' => $post->published_at?->format('j F Y'),
                        'category' => $post->category?->name,
                    ])
                    ->all(),
                'blog_url' => '/blog',
            ],
        ]);
    }
}
