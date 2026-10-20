<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    /**
     * Give the test account a full task list and the other users a few tasks each.
     */
    public function run(): void
    {
        $testUser = User::where('email', 'test@example.com')->firstOrFail();

        Task::factory()->count(40)->for($testUser)->create();

        User::whereKeyNot($testUser->getKey())->each(
            fn (User $user) => Task::factory()->count(8)->for($user)->create(),
        );
    }
}
