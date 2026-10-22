<?php

namespace App\Features\Cms\Policies;

use App\Features\Cms\Models\ContentEntry;
use App\Models\User;
use App\Support\Rbac;

/**
 * Who may do what to an entry. Each check is one permission, plus ownership where that applies.
 *
 * - Authors (content.edit-own) can change entries they wrote, but cannot publish them, schedule them, or trash them.
 * - Editors (content.edit-any) can change every entry on the site.
 * - Publishing is its own permission, so an entry can be edited without being made visible.
 */
class ContentEntryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Rbac::PERMISSION_CONTENT_VIEW);
    }

    public function view(User $user, ContentEntry $entry): bool
    {
        return $user->can(Rbac::PERMISSION_CONTENT_VIEW) && $this->mayEditAny($user, $entry, editOwn: true);
    }

    public function create(User $user): bool
    {
        return $user->can(Rbac::PERMISSION_CONTENT_CREATE);
    }

    public function update(User $user, ContentEntry $entry): bool
    {
        return $this->mayEditAny($user, $entry, editOwn: true);
    }

    /**
     * Set the entry to published, or give it a publish date. Checked whenever a request asks for either.
     */
    public function publish(User $user): bool
    {
        return $user->can(Rbac::PERMISSION_CONTENT_PUBLISH);
    }

    /**
     * Move to the trash.
     */
    public function delete(User $user, ContentEntry $entry): bool
    {
        return $user->can(Rbac::PERMISSION_CONTENT_DELETE);
    }

    public function restore(User $user, ContentEntry $entry): bool
    {
        return $user->can(Rbac::PERMISSION_CONTENT_DELETE);
    }

    public function forceDelete(User $user, ContentEntry $entry): bool
    {
        return $user->can(Rbac::PERMISSION_CONTENT_DELETE);
    }

    public function revisions(User $user, ContentEntry $entry): bool
    {
        return $this->update($user, $entry);
    }

    private function mayEditAny(User $user, ContentEntry $entry, bool $editOwn): bool
    {
        if ($user->can(Rbac::PERMISSION_CONTENT_EDIT_ANY)) {
            return true;
        }

        return $editOwn
            && $user->can(Rbac::PERMISSION_CONTENT_EDIT_OWN)
            && $entry->author_id !== null
            && (int) $entry->author_id === (int) $user->getKey();
    }
}
