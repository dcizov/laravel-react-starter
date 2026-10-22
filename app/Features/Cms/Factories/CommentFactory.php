<?php

namespace App\Features\Cms\Factories;

use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A fake visitor comment. New comments are pending, as they are on the public site.
 *
 * @extends Factory<Comment>
 */
class CommentFactory extends Factory
{
    protected $model = Comment::class;

    public function definition(): array
    {
        $faker = fake('de_DE');

        return [
            'entry_id' => ContentEntry::factory(),
            'author_name' => $faker->name(),
            'author_email' => $faker->safeEmail(),
            'body' => $faker->sentence(18),
            'status' => Comment::PENDING,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => ['status' => Comment::APPROVED]);
    }

    public function spam(): static
    {
        return $this->state(fn () => ['status' => Comment::SPAM]);
    }
}
