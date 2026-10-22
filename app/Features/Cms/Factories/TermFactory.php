<?php

namespace App\Features\Cms\Factories;

use App\Features\Cms\Models\Term;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * A fake category or tag. Terms belong to one content type, so use forType() or post() to choose it.
 *
 * @extends Factory<Term>
 */
class TermFactory extends Factory
{
    protected $model = Term::class;

    public function definition(): array
    {
        $name = ucfirst(fake('de_DE')->unique()->word());

        return [
            'content_type' => 'post',
            'taxonomy' => Term::CATEGORY,
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(3)),
        ];
    }

    public function category(): static
    {
        return $this->state(fn () => ['taxonomy' => Term::CATEGORY]);
    }

    public function tag(): static
    {
        return $this->state(fn () => ['taxonomy' => Term::TAG]);
    }

    public function forType(string $key): static
    {
        return $this->state(fn () => ['content_type' => $key]);
    }

    public function post(): static
    {
        return $this->forType('post');
    }
}
