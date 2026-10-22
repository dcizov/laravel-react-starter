<?php

namespace App\Features\Cms\Factories;

use App\Features\Cms\Models\ContentEntry;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Fake entries for every content type. Text is German, to match the preset landing page.
 * Use the states to choose the type and status, for example ContentEntry::factory()->post()->count(10)->create().
 *
 * @extends Factory<ContentEntry>
 */
class ContentEntryFactory extends Factory
{
    protected $model = ContentEntry::class;

    public function definition(): array
    {
        $faker = fake('de_DE');
        $title = rtrim($faker->sentence(4), '.');

        return [
            'content_type' => 'page',
            'title' => $title,
            // The random suffix keeps slugs unique within a type, even when titles repeat.
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(5)),
            'excerpt' => $faker->sentence(12),
            'body' => $this->body($faker),
            'featured_image' => null,
            'status' => ContentEntry::STATUS_PUBLISHED,
            'published_at' => now()->subDays($faker->numberBetween(1, 90)),
            'author_id' => null,
            'custom_fields' => [],
            'seo' => [],
        ];
    }

    public function page(): static
    {
        return $this->state(fn () => ['content_type' => 'page']);
    }

    public function post(): static
    {
        return $this->state(fn () => ['content_type' => 'post']);
    }

    public function forType(string $key): static
    {
        return $this->state(fn () => ['content_type' => $key]);
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => ContentEntry::STATUS_DRAFT, 'published_at' => null]);
    }

    /**
     * Published, but its date is in the future, so it is not shown yet.
     */
    public function scheduled(): static
    {
        return $this->state(fn () => ['published_at' => now()->addDays(14)]);
    }

    /**
     * A body with a heading, two paragraphs, and a list, in the same shape the block editor saves.
     *
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    private function body(\Faker\Generator $faker): array
    {
        return [
            ['id' => Str::random(8), 'type' => 'heading', 'data' => ['level' => 2, 'text' => $faker->sentence(3)]],
            ['id' => Str::random(8), 'type' => 'paragraph', 'data' => ['text' => $faker->paragraph()]],
            ['id' => Str::random(8), 'type' => 'paragraph', 'data' => ['text' => $faker->paragraph()]],
            ['id' => Str::random(8), 'type' => 'list', 'data' => ['ordered' => false, 'items' => $faker->words(3)]],
        ];
    }
}
