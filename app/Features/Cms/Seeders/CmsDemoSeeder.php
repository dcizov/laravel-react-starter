<?php

namespace App\Features\Cms\Seeders;

use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Models\Cta;
use App\Features\Cms\Models\Term;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo content for the cms feature: a custom content type with custom fields and comments, events,
 * pages, reusable calls to action, and categories and tags for each type.
 *
 * Safe to run again: everything is matched by its key or slug and updated rather than duplicated.
 * Comments are only added to an entry that has none yet.
 */
class CmsDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->contentTypes();
        $ctas = $this->ctas();
        $this->pages($ctas);
        $this->events();
    }

    private function contentTypes(): void
    {
        // The page type is created by the cms migrations. This adds a custom type with its own fields.
        ContentType::query()->firstOrCreate(['key' => 'events'], [
            'label' => 'Veranstaltungen',
            'singular_label' => 'Veranstaltung',
            'has_archive' => true,
            'supports' => [
                ContentType::SUPPORT_EXCERPT,
                ContentType::SUPPORT_IMAGE,
                ContentType::SUPPORT_CATEGORY,
                ContentType::SUPPORT_TAG,
                ContentType::SUPPORT_COMMENTS,
            ],
            'fields' => [
                ['key' => 'ort', 'label' => 'Ort', 'type' => 'text'],
                ['key' => 'datum', 'label' => 'Datum', 'type' => 'date'],
                ['key' => 'eintritt', 'label' => 'Eintritt', 'type' => 'text'],
                ['key' => 'anmeldung', 'label' => 'Anmeldung', 'type' => 'url'],
            ],
            'builtin' => false,
        ]);
    }

    /**
     * @return array<string, Cta>
     */
    private function ctas(): array
    {
        $ctas = [
            'Jetzt starten' => [
                'heading' => 'Bereit, loszulegen?',
                'text' => 'Erstelle dein Konto und probiere alles in wenigen Minuten aus.',
                'button_label' => 'Jetzt starten',
                'button_url' => '/register',
            ],
            'Kontakt aufnehmen' => [
                'heading' => 'Fragen? Wir helfen gern.',
                'text' => 'Schreib uns, und wir melden uns zeitnah zurück.',
                'button_label' => 'Zum Kontakt',
                'button_url' => '/pages/kontakt',
            ],
        ];

        $saved = [];

        foreach ($ctas as $name => $attributes) {
            $saved[$name] = Cta::query()->updateOrCreate(['name' => $name], $attributes);
        }

        return $saved;
    }

    /**
     * @param  array<string, Cta>  $ctas
     */
    private function pages(array $ctas): void
    {
        $this->entry('page', 'ueber-uns', [
            'title' => 'Über uns',
            'excerpt' => 'Wer wir sind und was uns antreibt.',
            'body' => [
                $this->block('heading', ['level' => 2, 'text' => 'Wer wir sind']),
                $this->block('paragraph', ['text' => "Wir bauen Werkzeuge, mit denen Teams schneller zu einer guten Website kommen. Das Projekt ist offen, modular und gut dokumentiert.\n\nJede Funktion lässt sich ein- und ausschalten, damit nur das installiert ist, was gebraucht wird."]),
                $this->block('list', ['ordered' => false, 'items' => ['Offen und nachvollziehbar', 'Modular aufgebaut', 'Auf Deutsch und Englisch nutzbar']]),
                $this->block('cta', ['cta_id' => $ctas['Jetzt starten']->id]),
            ],
        ]);

        $this->entry('page', 'kontakt', [
            'title' => 'Kontakt',
            'excerpt' => 'So erreichst du uns.',
            'body' => [
                $this->block('paragraph', ['text' => 'Für Fragen zu Funktionen, Preisen oder Zusammenarbeit schreib uns eine E-Mail oder nutze das Formular.']),
                $this->block('divider', []),
                $this->block('cta', ['cta_id' => $ctas['Kontakt aufnehmen']->id]),
            ],
        ]);

        $this->entry('page', 'datenschutz', [
            'title' => 'Datenschutz',
            'excerpt' => 'Welche Daten wir verarbeiten und warum.',
            'body' => [
                $this->block('heading', ['level' => 2, 'text' => 'Verantwortliche Stelle']),
                $this->block('paragraph', ['text' => 'Dies ist ein Beispieltext. Trage hier deine eigenen Angaben und Hinweise ein, bevor du die Seite veröffentlichst.']),
                $this->block('quote', ['text' => 'Nur die Daten, die wirklich nötig sind.', 'cite' => 'Grundsatz']),
            ],
        ]);

        // A draft: visible in the admin, not on the public site.
        $this->entry('page', 'roadmap-entwurf', [
            'title' => 'Roadmap (Entwurf)',
            'excerpt' => 'Was als Nächstes kommt.',
            'body' => [$this->block('paragraph', ['text' => 'Noch nicht veröffentlicht.'])],
            'status' => ContentEntry::STATUS_DRAFT,
            'published_at' => null,
        ]);
    }

    private function events(): void
    {
        $categories = $this->terms('events', Term::CATEGORY, ['Konferenz', 'Workshop']);
        $tags = $this->terms('events', Term::TAG, ['Laravel', 'React', 'Kostenlos']);

        $events = [
            'laravel-meetup-hannover' => [
                'title' => 'Laravel-Meetup Hannover',
                'excerpt' => 'Ein Abend mit Vorträgen und Austausch rund um Laravel.',
                'published_at' => now()->subDays(3),
                'custom_fields' => ['ort' => 'Hannover, Coworking Space Nord', 'datum' => now()->addDays(20)->toDateString(), 'eintritt' => 'Kostenlos', 'anmeldung' => 'https://example.com/anmeldung'],
                'categories' => ['Konferenz'],
                'tags' => ['Laravel', 'Kostenlos'],
                'comments' => [
                    ['author_name' => 'Ada Lovelace', 'body' => 'Ich bin dabei! Gibt es einen Vortrag zu Queues?', 'status' => Comment::APPROVED],
                    ['author_name' => 'Jonas Weber', 'body' => 'Super Idee. Kann man auch spontan kommen?', 'status' => Comment::APPROVED],
                    ['author_name' => 'Mira Schulz', 'body' => 'Ist das Event barrierefrei?', 'status' => Comment::PENDING],
                ],
            ],
            'react-workshop-inertia' => [
                'title' => 'Workshop: React mit Inertia',
                'excerpt' => 'Ein praktischer Nachmittag, an dem du eine Seite von Grund auf baust.',
                'published_at' => now()->subDays(10),
                'custom_fields' => ['ort' => 'Online', 'datum' => now()->addDays(42)->toDateString(), 'eintritt' => '49 €', 'anmeldung' => 'https://example.com/workshop'],
                'categories' => ['Workshop'],
                'tags' => ['React'],
                'comments' => [
                    ['author_name' => 'Tim Becker', 'body' => 'Wird die Aufzeichnung verschickt?', 'status' => Comment::APPROVED],
                ],
            ],
            'jahresrueckblick-2025' => [
                'title' => 'Jahresrückblick 2025',
                'excerpt' => 'Was im letzten Jahr passiert ist, in Zahlen und Bildern.',
                'published_at' => now()->subMonths(9),
                'custom_fields' => ['ort' => 'Hannover', 'datum' => now()->subMonths(10)->toDateString(), 'eintritt' => 'Kostenlos', 'anmeldung' => null],
                'categories' => ['Konferenz'],
                'tags' => ['Laravel', 'React'],
                'comments' => [],
            ],
            // A draft event, visible only in the admin.
            'herbstkonferenz-2027' => [
                'title' => 'Herbstkonferenz 2027 (Entwurf)',
                'excerpt' => 'Die große Konferenz im Herbst. Details folgen.',
                'status' => ContentEntry::STATUS_DRAFT,
                'published_at' => null,
                'custom_fields' => ['ort' => 'Hannover', 'datum' => '2027-10-01', 'eintritt' => 'noch offen', 'anmeldung' => null],
                'categories' => ['Konferenz'],
                'tags' => [],
                'comments' => [],
            ],
        ];

        foreach ($events as $slug => $event) {
            $entry = $this->entry('events', $slug, [
                'title' => $event['title'],
                'excerpt' => $event['excerpt'],
                'body' => [
                    $this->block('paragraph', ['text' => $event['excerpt'].' Die genauen Zeiten und Themen werden hier ergänzt, sobald sie feststehen.']),
                ],
                'published_at' => $event['published_at'] ?? null,
                'status' => $event['status'] ?? ContentEntry::STATUS_PUBLISHED,
                'custom_fields' => $event['custom_fields'],
            ]);

            $entry->terms()->sync([
                ...$this->termIds($categories, $event['categories']),
                ...$this->termIds($tags, $event['tags']),
            ]);

            if (! $entry->comments()->exists()) {
                foreach ($event['comments'] as $comment) {
                    $entry->comments()->create($comment);
                }
            }
        }
    }

    /**
     * Creates or updates an entry by type and slug. Defaults are a published entry with no terms.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function entry(string $type, string $slug, array $attributes): ContentEntry
    {
        return ContentEntry::query()->updateOrCreate(
            ['content_type' => $type, 'slug' => $slug],
            [
                'status' => ContentEntry::STATUS_PUBLISHED,
                'published_at' => now()->subDay(),
                'excerpt' => null,
                'featured_image' => null,
                'custom_fields' => [],
                'seo' => [],
                ...$attributes,
            ],
        );
    }

    /**
     * @param  list<string>  $names
     * @return array<string, Term>
     */
    private function terms(string $type, string $taxonomy, array $names): array
    {
        $terms = [];

        foreach ($names as $name) {
            $terms[$name] = Term::query()->updateOrCreate(
                ['content_type' => $type, 'taxonomy' => $taxonomy, 'slug' => Str::slug($name)],
                ['name' => $name],
            );
        }

        return $terms;
    }

    /**
     * @param  array<string, Term>  $terms
     * @param  list<string>  $names
     * @return list<int>
     */
    private function termIds(array $terms, array $names): array
    {
        return array_values(array_map(fn (string $name) => $terms[$name]->id, array_filter($names, fn (string $name) => isset($terms[$name]))));
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
