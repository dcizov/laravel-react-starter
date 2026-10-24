<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Page;
use App\Models\User;

class PagePolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can('pages.view');
    }

    public function view(User $actor, Page $page): bool
    {
        return $actor->can('pages.view');
    }

    public function create(User $actor): bool
    {
        return $actor->can('pages.create');
    }

    /**
     * Authors edit their own pages; editors and admins edit everything.
     */
    public function update(User $actor, Page $page): bool
    {
        if ($actor->can('pages.delete') || $actor->can('pages.publish')) {
            return $actor->can('pages.update');
        }

        return $actor->can('pages.update') && $page->author_id === $actor->id;
    }

    public function publish(User $actor, Page $page): bool
    {
        return $actor->can('pages.publish');
    }

    public function delete(User $actor, Page $page): bool
    {
        return $actor->can('pages.delete');
    }

    public function restore(User $actor, Page $page): bool
    {
        return $actor->can('pages.delete');
    }

    public function forceDelete(User $actor, Page $page): bool
    {
        return $actor->can('pages.delete');
    }
}
