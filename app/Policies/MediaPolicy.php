<?php

namespace App\Policies;

use App\Models\Media;
use App\Models\User;

/**
 * Media is team content: anyone who can see the library can view it, uploaders
 * need `media.upload`, and only editors (and up) may change or delete.
 */
class MediaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('media.view');
    }

    public function view(User $user, Media $media): bool
    {
        return $user->can('media.view');
    }

    public function create(User $user): bool
    {
        return $user->can('media.upload');
    }

    public function update(User $user, Media $media): bool
    {
        return $user->can('media.update');
    }

    public function delete(User $user, Media $media): bool
    {
        return $user->can('media.delete');
    }

    public function restore(User $user, Media $media): bool
    {
        return $user->can('media.delete');
    }

    public function manageFolders(User $user): bool
    {
        return $user->can('media.update');
    }
}
