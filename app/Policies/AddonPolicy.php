<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

/**
 * Addons are a policy target without a model: the policy is bound to the
 * `addons` resource in AuthServiceProvider-style `Gate::define` calls.
 */
class AddonPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can('addons.view');
    }

    public function activate(User $actor): bool
    {
        return $actor->can('addons.manage');
    }

    public function uninstall(User $actor): bool
    {
        return $actor->can('addons.manage');
    }
}
