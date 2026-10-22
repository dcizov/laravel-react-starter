<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    /**
     * Give the test account a full task list and the other users a few tasks each.
     *
     * Only runs where the test accounts exist (see UserSeeder), and only once: it does nothing if tasks already exist.
     */
    public function run(): void
    {
        $testUser = User::query()->where('email', 'test@example.com')->first();

        if ($testUser === null || Task::query()->exists()) {
            return;
        }

        Task::factory()->count(40)->for($testUser)->create();

        User::whereKeyNot($testUser->getKey())->each(
            fn (User $user) => Task::factory()->count(8)->for($user)->create(),
        );
    }
}
