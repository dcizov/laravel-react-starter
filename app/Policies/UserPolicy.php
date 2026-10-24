<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can('users.view');
    }

    public function view(User $actor, User $user): bool
    {
        return $actor->can('users.view') || $actor->is($user);
    }

    /**
     * Inviting, changing roles and deactivating accounts is an admin action.
     */
    public function manage(User $actor): bool
    {
        return $actor->can('users.manage');
    }

    public function invite(User $actor): bool
    {
        return $this->manage($actor);
    }

    public function update(User $actor, User $user): bool
    {
        return $this->manage($actor) && ! $user->isLastAdmin();
    }

    public function delete(User $actor, User $user): bool
    {
        return $this->manage($actor)
            && ! $actor->is($user)
            && ! $user->isLastAdmin();
    }
}
