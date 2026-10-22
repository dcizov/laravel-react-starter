<?php

namespace App\Features\Cms\Factories;

use App\Features\Cms\Models\Cta;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A fake reusable call to action.
 *
 * @extends Factory<Cta>
 */
class CtaFactory extends Factory
{
    protected $model = Cta::class;

    public function definition(): array
    {
        $faker = fake('de_DE');

        return [
            'name' => $faker->unique()->words(2, true),
            'heading' => rtrim($faker->sentence(4), '.').'?',
            'text' => $faker->sentence(10),
            'button_label' => $faker->randomElement(['Jetzt starten', 'Mehr erfahren', 'Kontakt aufnehmen']),
            'button_url' => '/register',
        ];
    }
}
