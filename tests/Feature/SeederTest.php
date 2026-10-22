<?php

use App\Models\Task;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

// The base seeders add the test accounts and tasks. Running them again must not duplicate anything.

test('running the database seeder twice does not duplicate users or tasks', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(User::count())->toBe(4)
        ->and(Task::count())->toBe(40 + 3 * 8);
});

test('the test account is only created once', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(User::where('email', 'test@example.com')->count())->toBe(1);
});
