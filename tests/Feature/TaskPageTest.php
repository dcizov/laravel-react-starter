<?php

use App\Models\Task;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\DB;

test('guests are redirected from the tasks page', function () {
    $this->get(route('tasks.index'))->assertRedirect(route('login'));
});

test('tasks page lists only the signed-in user\'s tasks', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Task::factory()->count(3)->for($user)->create();
    Task::factory()->count(2)->for($otherUser)->create();

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tasks')
            ->has('tasks', 3)
            ->has('tasks.0', fn ($task) => $task
                ->hasAll(['id', 'code', 'title', 'status', 'label', 'priority'])
                ->etc()));
});

test('database seeder creates example users and tasks', function () {
    $this->seed(DatabaseSeeder::class);

    expect(User::count())->toBe(4)
        ->and(User::where('email', 'test@example.com')->firstOrFail()->tasks()->count())->toBe(40)
        ->and(Task::count())->toBe(40 + 3 * 8);
});

test('deleting a user removes their tasks', function () {
    $user = User::factory()->create();
    Task::factory()->count(2)->for($user)->create();

    $user->delete();

    expect(DB::table('tasks')->where('user_id', $user->id)->count())->toBe(0);
});
