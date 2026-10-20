<?php

use App\Models\Task;
use App\Models\User;
use App\Support\Rbac;

beforeEach(function () {
    // The page is rendered without a built Vite manifest, so the test does not depend on `npm run build`.
    $this->withoutVite();

    Rbac::sync();
});

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('the dashboard counts only the signed-in user\'s tasks', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'status' => 'todo', 'priority' => 'high']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'in progress', 'priority' => 'low']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'done', 'priority' => 'high']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'canceled', 'priority' => 'high']);

    // Someone else's tasks must not change the numbers.
    Task::factory()->count(3)->create(['status' => 'todo', 'priority' => 'high']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('summary.total', 4)
            ->where('summary.open', 2)
            ->where('summary.in_progress', 1)
            ->where('summary.done', 1)
            ->where('summary.high_priority', 1)
            ->where('showOwner', false)
            ->where('usersCount', null)
            ->has('attention', 1)
            ->has('recent', 4));
});

test('users with tasks.view-any see every task and the user count', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    Task::factory()->count(2)->create(['status' => 'todo', 'priority' => 'high']);
    Task::factory()->create(['status' => 'done', 'priority' => 'low']);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.total', 4)
            ->where('summary.open', 2)
            ->where('summary.high_priority', 2)
            ->where('showOwner', true)
            ->where('usersCount', User::count())
            ->has('attention', 2)
            ->has('attention.0.owner'));
});

test('the attention list only holds open high-priority tasks', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'status' => 'done', 'priority' => 'high', 'title' => 'Finished']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'todo', 'priority' => 'low', 'title' => 'Low']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'todo', 'priority' => 'high', 'title' => 'Urgent']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('attention', 1)
            ->where('attention.0.title', 'Urgent'));
});

test('a new account sees an empty dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.total', 0)
            ->has('attention', 0)
            ->has('recent', 0));
});
