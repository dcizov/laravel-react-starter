<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Page;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Page>
 */
class PageFactory extends Factory
{
    protected $model = Page::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'title' => $title,
            // Derived from the title the caller actually passes, not the faked one.
            'slug' => fn (array $attributes): string => Str::slug((string) $attributes['title']),
            'status' => Page::STATUS_DRAFT,
            'template' => 'page',
            'excerpt' => fake()->sentence(12),
            'content' => [
                [
                    'id' => (string) Str::uuid(),
                    'section' => 'hero',
                    'enabled' => true,
                    'content' => [
                        'eyebrow' => '',
                        'heading' => $title,
                        'body' => fake()->sentence(16),
                        'align' => 'center',
                        'cta_label' => '',
                        'cta_url' => '',
                        'image' => null,
                    ],
                ],
            ],
            'robots' => 'index,follow',
        ];
    }

    /**
     * Real pages always get an initial revision (see PageRepository::create),
     * so factory pages do too — tests must not see a state the app can't produce.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Page $page): void {
            $page->revisions()->create([
                'user_id' => $page->author_id,
                'title' => $page->title,
                'content' => $page->content,
                'label' => 'Created',
            ]);
        });
    }

    public function published(): static
    {
        return $this->state(fn (): array => [
            'status' => Page::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ]);
    }

    public function scheduled(): static
    {
        return $this->state(fn (): array => [
            'status' => Page::STATUS_SCHEDULED,
            'scheduled_at' => now()->addDay(),
        ]);
    }
}
