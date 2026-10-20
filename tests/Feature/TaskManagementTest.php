<?php

use App\Models\Task;
use App\Models\User;

test('a signed-in user can create a task', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('tasks.store'), [
            'title' => 'Write the release notes',
            'status' => 'todo',
            'label' => 'documentation',
            'priority' => 'high',
        ])
        ->assertRedirect(route('tasks.index'));

    $task = $user->tasks()->sole();

    expect($task->title)->toBe('Write the release notes')
        ->and($task->status)->toBe('todo')
        ->and($task->code)->toStartWith('TASK-');
});

test('creating a task validates the options', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('tasks.store'), [
            'title' => '',
            'status' => 'finished',
            'label' => 'bug',
            'priority' => 'urgent',
        ])
        ->assertSessionHasErrors(['title', 'status', 'priority']);

    expect(Task::count())->toBe(0);
});

test('a user can change the label of their own task', function () {
    $user = User::factory()->create();
    $task = Task::factory()->for($user)->create(['label' => 'bug']);

    $this->actingAs($user)
        ->patch(route('tasks.update', $task), ['label' => 'feature'])
        ->assertRedirect(route('tasks.index'));

    expect($task->fresh()->label)->toBe('feature')
        ->and($task->fresh()->title)->toBe($task->title);
});

test('a user can delete their own task', function () {
    $user = User::factory()->create();
    $task = Task::factory()->for($user)->create();

    $this->actingAs($user)
        ->delete(route('tasks.destroy', $task))
        ->assertRedirect(route('tasks.index'));

    expect(Task::find($task->id))->toBeNull();
});

test('a user cannot change or delete another user\'s task', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $task = Task::factory()->for($owner)->create(['label' => 'bug']);

    $this->actingAs($intruder)
        ->patch(route('tasks.update', $task), ['label' => 'feature'])
        ->assertForbidden();

    $this->actingAs($intruder)
        ->delete(route('tasks.destroy', $task))
        ->assertForbidden();

    expect($task->fresh()->label)->toBe('bug')
        ->and(Task::find($task->id))->not->toBeNull();
});

test('guests cannot manage tasks', function () {
    $task = Task::factory()->create();

    $this->post(route('tasks.store'), ['title' => 'x', 'status' => 'todo', 'label' => 'bug', 'priority' => 'low'])
        ->assertRedirect(route('login'));
    $this->patch(route('tasks.update', $task), ['label' => 'feature'])
        ->assertRedirect(route('login'));
    $this->delete(route('tasks.destroy', $task))
        ->assertRedirect(route('login'));
});
