<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Models\Task;
use App\Support\Rbac;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /**
     * The tasks the user can see: their own, or every task for users with tasks.view-any.
     * Only the columns the Tasks page shows are sent.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewAll = $user->hasPermission(Rbac::PERMISSION_TASKS_VIEW_ANY);

        $tasks = ($canViewAll ? Task::query() : $user->tasks())
            ->with('user:id,name')
            ->orderBy('id')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'code' => $task->code,
                'title' => $task->title,
                'status' => $task->status,
                'label' => $task->label,
                'priority' => $task->priority,
                'owner' => $canViewAll ? $task->user?->name : null,
            ]);

        return Inertia::render('tasks', [
            'tasks' => $tasks,
            'showOwner' => $canViewAll,
        ]);
    }

    /**
     * Create a task for the signed-in user.
     */
    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $request->user()->tasks()->create([
            ...$request->validated(),
            'code' => Task::newCode(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task created.')]);

        return to_route('tasks.index');
    }

    /**
     * Change one or more fields of a task the user owns.
     */
    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        Gate::authorize('update', $task);

        $task->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task updated.')]);

        return to_route('tasks.index');
    }

    /**
     * Delete a task the user owns.
     */
    public function destroy(Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task deleted.')]);

        return to_route('tasks.index');
    }
}
