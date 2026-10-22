<?php

namespace App\Features\Landing;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Support\ContentPresenter;
use App\Features\Cms\Support\CtaReference;
use App\Features\FeatureRegistry;

/**
 * Fills in the parts of the landing page that come from other features, when the page is shown:
 * saved calls to action (cms) and the latest posts (blog). The draft itself never stores these.
 */
final class LandingContent
{
    /**
     * @param  list<array{id: string, type: string, data: array<string, mixed>}>  $blocks
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    public static function apply(array $blocks, FeatureRegistry $features): array
    {
        // A latest-posts block needs the blog. Without it the block is left out, not shown empty.
        if (! $features->isEnabled('blog')) {
            $blocks = array_values(array_filter($blocks, fn (array $block) => $block['type'] !== 'posts'));
        }

        if ($features->isEnabled('cms')) {
            $blocks = CtaReference::apply($blocks);
        }

        $postBlocks = array_filter($blocks, fn (array $block) => $block['type'] === 'posts');

        if ($postBlocks === []) {
            return $blocks;
        }

        $newest = self::latest(max(array_map(fn (array $block) => (int) $block['data']['count'], $postBlocks)));

        return array_map(function (array $block) use ($newest) {
            if ($block['type'] !== 'posts') {
                return $block;
            }

            $block['data']['posts'] = array_slice($newest, 0, (int) $block['data']['count']);

            return $block;
        }, $blocks);
    }

    /**
     * The newest live posts, as the public blog shows them. Used for the posts blocks and for the editor's preview.
     *
     * @return list<array{id: int, title: string, slug: string, excerpt: string|null, featuredImage: string|null, publishedAt: string|null, url: string}>
     */
    public static function latest(int $count): array
    {
        return ContentEntry::query()
            ->where('content_type', 'post')
            ->live()
            ->orderByDesc('published_at')
            ->limit($count)
            ->get()
            ->map(fn (ContentEntry $entry) => ContentPresenter::summary($entry))
            ->values()
            ->all();
    }
}
