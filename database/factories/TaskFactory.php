<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'code' => 'TASK-'.fake()->unique()->numberBetween(1000, 9999),
            'title' => ucfirst(fake()->sentence(fake()->numberBetween(4, 12))),
            'status' => fake()->randomElement(Task::STATUSES),
            'label' => fake()->randomElement(Task::LABELS),
            'priority' => fake()->randomElement(Task::PRIORITIES),
        ];
    }
}
