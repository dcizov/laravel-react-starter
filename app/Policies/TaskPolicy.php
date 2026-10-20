<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use App\Support\Rbac;

class TaskPolicy
{
    /**
     * The owner can change a task. So can anyone with the tasks.update-any permission.
     */
    public function update(User $user, Task $task): bool
    {
        return $user->is($task->user) || $user->hasPermission(Rbac::PERMISSION_TASKS_UPDATE_ANY);
    }

    /**
     * The owner can delete a task. So can anyone with the tasks.delete-any permission.
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->is($task->user) || $user->hasPermission(Rbac::PERMISSION_TASKS_DELETE_ANY);
    }
}
