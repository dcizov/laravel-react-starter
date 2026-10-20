<?php

use App\Models\User;

test('guests are redirected from the tasks page', function () {
    $this->get(route('tasks.index'))->assertRedirect(route('login'));
});

test('tasks page lists the sample tasks', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tasks')
            ->has('tasks', 100)
            ->where('tasks.0.id', 'TASK-8782')
            ->has('tasks.0', fn ($task) => $task
                ->hasAll(['id', 'title', 'status', 'label', 'priority'])
                ->etc()));
});

