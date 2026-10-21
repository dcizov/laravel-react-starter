<?php

use App\Models\Task;
use App\Models\User;
use App\Support\Rbac;

beforeEach(function () {
    Rbac::sync();
});

function userWithTasks(): array
{
    $user = User::factory()->create();
    $user->assignRole(Rbac::DEFAULT_ROLE);

    return [$user, Task::factory()->for($user)->create(), Task::factory()->for($user)->create()];
}

test('a saved drag order is shown back to the same user', function () {
    [$user, $first, $second] = userWithTasks();

    $this->actingAs($user)
        ->put(route('tasks.reorder'), ['ids' => [$second->id, $first->id]])
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertInertia(fn ($page) => $page
            ->where('tasks.0.id', $second->id)
            ->where('tasks.1.id', $first->id));
});

test('one user\'s order does not change another user\'s list', function () {
    [$user, $first, $second] = userWithTasks();
    [$other, $otherFirst] = userWithTasks();

    $this->actingAs($user)
        ->put(route('tasks.reorder'), ['ids' => [$second->id, $first->id]]);

    // The other user still sees their own tasks in id order.
    $this->actingAs($other)
        ->get(route('tasks.index'))
        ->assertInertia(fn ($page) => $page->where('tasks.0.id', $otherFirst->id));
});

test('ids the user cannot see are ignored when saving the order', function () {
    [$user, $first] = userWithTasks();
    [, $someoneElsesTask] = userWithTasks();

    $this->actingAs($user)
        ->put(route('tasks.reorder'), ['ids' => [$someoneElsesTask->id, $first->id]])
        ->assertRedirect();

    $this->assertDatabaseMissing('task_orders', ['task_id' => $someoneElsesTask->id]);
    // The hidden id is dropped before positions are assigned, so the visible task is first.
    $this->assertDatabaseHas('task_orders', ['task_id' => $first->id, 'position' => 0]);
});
