<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Models\Task;
use App\Support\Rbac;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $canViewAll = $user->can(Rbac::PERMISSION_TASKS_VIEW_ANY);

        // Each user's own drag order. Tasks they have not placed yet come last, by id.
        $positions = DB::table('task_orders')
            ->where('user_id', $user->id)
            ->pluck('position', 'task_id');

        $tasks = ($canViewAll ? Task::query() : $user->tasks())
            ->with('user:id,name')
            ->orderBy('id')
            ->get()
            ->sortBy(fn (Task $task) => sprintf(
                '%010d-%010d',
                $positions[$task->id] ?? 9999999999,
                $task->id,
            ))
            ->values()
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
     * Save the order the user dragged the tasks into. The ids are the full list in display order.
     * Only tasks the user can see are stored, so an id they cannot see is ignored.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'max:1000'],
            'ids.*' => ['integer', 'distinct'],
        ]);

        $user = $request->user();
        $canViewAll = $user->can(Rbac::PERMISSION_TASKS_VIEW_ANY);

        $visible = ($canViewAll ? Task::query() : $user->tasks())
            ->whereIn('id', $validated['ids'])
            ->pluck('id')
            ->all();

        // Keep the order the client sent, dropping anything that is not visible.
        $ordered = array_values(array_intersect($validated['ids'], $visible));

        DB::transaction(function () use ($user, $ordered) {
            DB::table('task_orders')->where('user_id', $user->id)->delete();

            DB::table('task_orders')->insert(array_map(
                fn (int $taskId, int $position) => [
                    'user_id' => $user->id,
                    'task_id' => $taskId,
                    'position' => $position,
                ],
                $ordered,
                array_keys($ordered),
            ));
        });

        return back();
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
