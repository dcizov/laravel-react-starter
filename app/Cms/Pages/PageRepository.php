<?php

declare(strict_types=1);

namespace App\Cms\Pages;

use App\Cms\Sections\SectionRegistry;
use App\Models\Page;
use App\Models\PageRevision;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Everything that mutates a page in more than one place at once.
 */
final class PageRepository
{
    public function __construct(
        private readonly Slugger $slugs,
        private readonly SectionRegistry $sections,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $author, array $data): Page
    {
        $title = (string) $data['title'];

        $page = Page::query()->create([
            'title' => $title,
            'slug' => $this->slugs->unique((string) ($data['slug'] ?? $title)),
            'status' => Page::STATUS_DRAFT,
            'template' => (string) ($data['template'] ?? 'page'),
            'author_id' => $author->id,
            'excerpt' => $data['excerpt'] ?? null,
            'content' => $this->sections->normalize($data['content'] ?? $this->sections->blankPage()),
            'seo_title' => $data['seo_title'] ?? null,
            'seo_description' => $data['seo_description'] ?? null,
            'robots' => (string) ($data['robots'] ?? 'index,follow'),
        ]);

        $this->snapshot($page, $author, 'Created');

        return $page;
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  int|null  $baseVersion  the version the editor loaded; a save that
     *                                 started before someone else's save is rejected
     *                                 rather than silently overwriting it
     */
    public function update(Page $page, array $data, User $editor, string $label = 'Saved', ?int $baseVersion = null): Page
    {
        if ($baseVersion !== null) {
            // The check and the write share one transaction, and the row is
            // locked, so two saves can never both read the same version.
            return DB::transaction(fn (): Page => $this->applyUpdate($page, $data, $editor, $label, $baseVersion));
        }

        return $this->applyUpdate($page, $data, $editor, $label, null);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyUpdate(Page $page, array $data, User $editor, string $label, ?int $baseVersion): Page
    {
        $current = Page::query()->whereKey($page->getKey())->lockForUpdate()->firstOrFail();

        if ($baseVersion !== null && $current->version !== $baseVersion) {
            throw ValidationException::withMessages([
                'page' => 'This page was saved somewhere else. Reload it to see the newer version before saving again.',
            ]);
        }

        $page = $current;

        if (array_key_exists('slug', $data) && is_string($data['slug']) && $data['slug'] !== '') {
            $this->slugs->rename($page, $data['slug']);
        }

        $page->fill([
            'title' => $data['title'] ?? $page->title,
            'excerpt' => array_key_exists('excerpt', $data) ? $data['excerpt'] : $page->excerpt,
            'content' => array_key_exists('content', $data)
                ? $this->sections->normalize($data['content'])
                : $page->content,
            'seo_title' => array_key_exists('seo_title', $data) ? $data['seo_title'] : $page->seo_title,
            'seo_description' => array_key_exists('seo_description', $data) ? $data['seo_description'] : $page->seo_description,
            'robots' => $data['robots'] ?? $page->robots,
            'template' => $data['template'] ?? $page->template,
            'version' => $page->version + 1,
        ])->save();

        $this->snapshot($page, $editor, $label);

        return $page;
    }

    /**
     * Write a revision, but never twice within a minute with identical content:
     * autosave would otherwise flood the history.
     */
    public function snapshot(Page $page, ?User $user, string $label = 'Autosaved', bool $force = false): PageRevision
    {
        $last = $page->revisions()->first();

        if (! $force
            && $last !== null
            && $last->title === $page->title
            && $last->content === $page->content
            && $last->created_at !== null
            && $last->created_at->gt(now()->subMinute())) {
            return $last;
        }

        return PageRevision::query()->create([
            'page_id' => $page->id,
            'user_id' => $user?->id,
            'title' => $page->title,
            'content' => $page->content,
            'label' => $label,
        ]);
    }

    public function restoreRevision(Page $page, PageRevision $revision, User $user): Page
    {
        return DB::transaction(function () use ($page, $revision, $user): Page {
            // Keep the current state so a restore can itself be undone.
            $this->snapshot($page, $user, 'Before restore', force: true);

            $page->fill([
                'title' => $revision->title,
                'content' => $revision->content,
                'version' => $page->version + 1,
            ])->save();

            $this->snapshot($page, $user, "Restored revision #{$revision->id}");

            return $page;
        });
    }

    public function publish(Page $page, ?User $user = null, ?Carbon $at = null): Page
    {
        $publishedAt = $at ?? now();

        $page->forceFill([
            'status' => Page::STATUS_PUBLISHED,
            'published_at' => $page->published_at ?? $publishedAt,
            'scheduled_at' => null,
            'version' => $page->version + 1,
        ])->save();

        $this->snapshot($page, $user, 'Published');

        return $page;
    }

    public function unpublish(Page $page, ?User $user = null): Page
    {
        $page->forceFill([
            'status' => Page::STATUS_DRAFT,
            'published_at' => null,
            'scheduled_at' => null,
            'version' => $page->version + 1,
        ])->save();

        $this->snapshot($page, $user, 'Unpublished');

        return $page;
    }

    public function schedule(Page $page, Carbon $at, ?User $user = null): Page
    {
        $page->forceFill([
            'status' => Page::STATUS_SCHEDULED,
            'scheduled_at' => $at,
            'published_at' => null,
            'version' => $page->version + 1,
        ])->save();

        $this->snapshot($page, $user, 'Scheduled for '.$at->toDayDateTimeString());

        return $page;
    }

    public function duplicate(Page $page, User $user): Page
    {
        $copy = Page::query()->create([
            ...$page->only([
                'template', 'excerpt', 'content', 'seo_title', 'seo_description', 'robots',
            ]),
            'title' => $page->title.' (copy)',
            'slug' => $this->slugs->unique($page->slug.'-copy'),
            'status' => Page::STATUS_DRAFT,
            'author_id' => $user->id,
            'published_at' => null,
            'scheduled_at' => null,
        ]);

        $this->snapshot($copy, $user, 'Duplicated from #'.$page->id);

        return $copy;
    }
}
