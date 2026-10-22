<?php

namespace App\Features\Blog\Seeders;

use App\Features\Cms\Factories\ContentEntryFactory;
use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Models\Term;
use App\Support\Sites\CurrentSite;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Demo content for the blog: categories and tags for posts, a handful of curated posts with comments,
 * and enough generated posts to fill a second page of the blog.
 *
 * Safe to run again: curated posts are matched by slug, and generated posts are only added up to a total of 14.
 */
class BlogDemoSeeder extends Seeder
{
    private const TOTAL_POSTS = 14;

    public function run(): void
    {
        $post = ContentType::query()->firstOrCreate(['key' => 'post'], [
            'label' => 'Blog',
            'singular_label' => 'Beitrag',
            'has_archive' => true,
            'supports' => [ContentType::SUPPORT_EXCERPT, ContentType::SUPPORT_IMAGE, ContentType::SUPPORT_CATEGORY, ContentType::SUPPORT_TAG, ContentType::SUPPORT_COMMENTS],
            'fields' => [],
            'builtin' => true,
        ]);

        $categories = $this->terms(Term::CATEGORY, ['Neuigkeiten', 'Tutorials']);
        $tags = $this->terms(Term::TAG, ['Laravel', 'Inertia', 'Tipps', 'Sicherheit']);

        $posts = $this->curatedPosts();

        foreach ($posts as $slug => $attributes) {
            $entry = ContentEntry::query()->updateOrCreate(
                ['content_type' => $post->key, 'slug' => $slug],
                [
                    'site_id' => app(CurrentSite::class)->id(),
                    'status' => ContentEntry::STATUS_PUBLISHED,
                    'published_at' => now()->subDays($attributes['days_ago']),
                    'excerpt' => $attributes['excerpt'],
                    'body' => $attributes['body'],
                    'custom_fields' => [],
                    'seo' => [],
                    'title' => $attributes['title'],
                    ...($attributes['draft'] ?? false ? ['status' => ContentEntry::STATUS_DRAFT, 'published_at' => null] : []),
                ],
            );

            $entry->terms()->sync([
                ...array_map(fn (string $name) => $categories[$name]->id, $attributes['categories']),
                ...array_map(fn (string $name) => $tags[$name]->id, $attributes['tags']),
            ]);

            if (! $entry->comments()->exists()) {
                foreach ($attributes['comments'] ?? [] as $comment) {
                    $entry->comments()->create($comment);
                }
            }
        }

        // Generated posts fill the archive out to a second page. Each gets one category and up to two tags.
        $missing = self::TOTAL_POSTS - ContentEntry::query()->where('content_type', $post->key)->count();

        if ($missing > 0) {
            ContentEntryFactory::new()->post()->count($missing)->create()->each(function (ContentEntry $entry) use ($categories, $tags) {
                $entry->terms()->sync([
                    $categories->random()->id,
                    ...$tags->random(random_int(1, 2))->pluck('id')->all(),
                ]);

                if (random_int(0, 2) === 0) {
                    $entry->comments()->create([
                        'author_name' => fake('de_DE')->name(),
                        'author_email' => null,
                        'body' => fake('de_DE')->sentence(14),
                        'status' => Comment::APPROVED,
                    ]);
                }
            });
        }
    }

    /**
     * @param  list<string>  $names
     * @return Collection<string, Term>
     */
    private function terms(string $taxonomy, array $names): Collection
    {
        $terms = collect();

        foreach ($names as $name) {
            $terms[$name] = Term::query()->updateOrCreate(
                ['content_type' => 'post', 'taxonomy' => $taxonomy, 'slug' => Str::slug($name)],
                ['site_id' => app(CurrentSite::class)->id(), 'name' => $name],
            );
        }

        return $terms;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function curatedPosts(): array
    {
        return [
            'willkommen-im-blog' => [
                'title' => 'Willkommen im Blog',
                'excerpt' => 'Was du hier in Zukunft lesen wirst.',
                'days_ago' => 30,
                'body' => $this->paragraphs(
                    'Hier schreiben wir über Neuigkeiten, Anleitungen und die Entscheidungen hinter dem Projekt.',
                    'Kommentare sind willkommen. Sie erscheinen, sobald sie geprüft wurden.',
                ),
                'categories' => ['Neuigkeiten'],
                'tags' => ['Laravel'],
                'comments' => [
                    ['author_name' => 'Lea Hoffmann', 'author_email' => null, 'body' => 'Schön, dass es jetzt einen Blog gibt!', 'status' => Comment::APPROVED],
                    ['author_name' => 'Ben Krüger', 'author_email' => null, 'body' => 'Bitte mehr Beiträge über Tests.', 'status' => Comment::PENDING],
                ],
            ],
            'inertia-in-fuenf-minuten' => [
                'title' => 'Inertia.js in fünf Minuten',
                'excerpt' => 'Eine kurze Einführung, wie Laravel und React zusammenspielen.',
                'days_ago' => 21,
                'body' => $this->paragraphs(
                    'Inertia verbindet ein Laravel-Backend mit einer React-Oberfläche, ohne dass du eine eigene API bauen musst.',
                    'Die Controller geben eine Seite und ihre Daten zurück. Den Rest erledigt die Oberfläche.',
                ),
                'categories' => ['Tutorials'],
                'tags' => ['Inertia', 'Laravel', 'Tipps'],
                'comments' => [
                    ['author_name' => 'Sophie Wagner', 'author_email' => null, 'body' => 'Super verständlich erklärt.', 'status' => Comment::APPROVED],
                ],
            ],
            'rollen-und-rechte-richtig-setzen' => [
                'title' => 'Rollen und Rechte richtig setzen',
                'excerpt' => 'Nur die Berechtigungen vergeben, die jemand wirklich braucht.',
                'days_ago' => 12,
                'body' => $this->paragraphs(
                    'Jede Funktion im Admin-Bereich hat eine eigene Berechtigung. So lässt sich genau steuern, wer was ändern darf.',
                    'Lege für Redakteure eine eigene Rolle an, die nur Inhalte verwaltet.',
                ),
                'categories' => ['Tutorials'],
                'tags' => ['Sicherheit'],
                'comments' => [],
            ],
            'eigene-inhaltstypen-mit-dem-cms' => [
                'title' => 'Eigene Inhaltstypen mit dem CMS',
                'excerpt' => 'Veranstaltungen, Produkte oder Kundenstimmen: eigene Typen mit eigenen Feldern.',
                'days_ago' => 5,
                'body' => $this->paragraphs(
                    'Neben Seiten und Beiträgen kannst du eigene Inhaltstypen anlegen, etwa für Veranstaltungen.',
                    'Jeder Typ hat eigene Felder, eigene Kategorien und Schlagwörter und auf Wunsch eine Kommentarfunktion.',
                ),
                'categories' => ['Tutorials', 'Neuigkeiten'],
                'tags' => ['Laravel'],
                'comments' => [
                    ['author_name' => 'Jonas Weber', 'author_email' => null, 'body' => 'Genau so etwas habe ich gesucht.', 'status' => Comment::APPROVED],
                ],
            ],
            // A draft: visible in the admin, not on the blog.
            'ausblick-entwurf' => [
                'title' => 'Ausblick aufs nächste Quartal (Entwurf)',
                'excerpt' => 'Noch in Arbeit.',
                'days_ago' => 0,
                'draft' => true,
                'body' => $this->paragraphs('Noch nicht fertig.'),
                'categories' => ['Neuigkeiten'],
                'tags' => [],
                'comments' => [],
            ],
        ];
    }

    /**
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    private function paragraphs(string ...$texts): array
    {
        return array_map(
            fn (string $text) => ['id' => Str::random(8), 'type' => 'paragraph', 'data' => ['text' => $text]],
            $texts,
        );
    }
}
