<?php

namespace Database\Seeders;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Models\Scopes\SiteScope;
use App\Models\Site;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * A second site, "Newsroom", in German, reached by path at /s/newsroom. It has its own pages (its home page is
 * set in the site settings), and a post when the blog is enabled. It shows that content, categories and tags, and
 * calls to action are kept apart per site. The default site is left as it is.
 *
 * Safe to run again: the site is matched by slug, and entries are matched by site, type and slug.
 */
class SitesDemoSeeder extends Seeder
{
    public function run(): void
    {
        $site = Site::query()->updateOrCreate(
            ['slug' => 'newsroom'],
            [
                'name' => 'Newsroom',
                'domain' => null,
                'locale' => 'de',
                'is_default' => false,
                'settings' => [
                    'description' => 'Neuigkeiten aus dem Projekt, kurz und verständlich.',
                    'home_slug' => 'startseite',
                ],
            ],
        );

        $this->page($site, 'startseite', 'Willkommen in der Newsroom', [
            $this->block('paragraph', ['text' => 'Hier stehen die neuesten Mitteilungen dieses Standorts. Diese Seite ist als Startseite in den Einstellungen des Standorts festgelegt.']),
        ]);

        $this->page($site, 'ueber-uns', 'Über die Newsroom', [
            $this->block('heading', ['level' => 2, 'text' => 'Wofür diese Seite da ist']),
            $this->block('paragraph', ['text' => 'Dieser Standort zeigt, wie ein zweiter Auftritt neben dem Hauptauftritt aussieht: eigene Seiten, eigene Beiträge und eigene Einstellungen.']),
        ]);

        // The blog belongs to the site too. Only added when the blog is on, as its post type is created there.
        if (ContentType::query()->where('key', 'post')->exists()) {
            $this->post($site, 'newsroom-start', 'Die Newsroom ist online', 'Ein erster Beitrag nur für diesen Standort.');
        }
    }

    /**
     * @param  array<int, array{id: string, type: string, data: array<string, mixed>}>  $body
     */
    private function page(Site $site, string $slug, string $title, array $body): void
    {
        $this->entry($site, 'page', $slug, [
            'title' => $title,
            'excerpt' => null,
            'body' => $body,
        ]);
    }

    private function post(Site $site, string $slug, string $title, string $excerpt): void
    {
        $this->entry($site, 'post', $slug, [
            'title' => $title,
            'excerpt' => $excerpt,
            'body' => [
                $this->block('paragraph', ['text' => 'Dieser Beitrag gehört zum Standort Newsroom und erscheint nur dort.']),
            ],
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function entry(Site $site, string $type, string $slug, array $attributes): void
    {
        // The site scope would hide the other site's rows from this lookup, so it is switched off and the site is
        // given explicitly.
        ContentEntry::query()->withoutGlobalScope(SiteScope::class)->updateOrCreate(
            ['site_id' => $site->id, 'content_type' => $type, 'slug' => $slug],
            [
                'status' => ContentEntry::STATUS_PUBLISHED,
                'published_at' => now()->subDay(),
                'featured_image' => null,
                'custom_fields' => [],
                'seo' => [],
                ...$attributes,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{id: string, type: string, data: array<string, mixed>}
     */
    private function block(string $type, array $data): array
    {
        return ['id' => Str::random(8), 'type' => $type, 'data' => $data];
    }
}
