<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Only the owner can change a task.
     */
    public function update(User $user, Task $task): bool
    {
        return $user->is($task->user);
    }

    /**
     * Only the owner can delete a task.
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->is($task->user);
    }
}
