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
     * The statuses, labels, and priorities a task can have. They match the Tasks page options.
     */
    public const STATUSES = ['backlog', 'todo', 'in progress', 'done', 'canceled'];

    public const LABELS = ['bug', 'feature', 'documentation'];

    public const PRIORITIES = ['low', 'medium', 'high'];

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
            'status' => fake()->randomElement(self::STATUSES),
            'label' => fake()->randomElement(self::LABELS),
            'priority' => fake()->randomElement(self::PRIORITIES),
        ];
    }
}
