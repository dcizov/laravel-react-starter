<?php

namespace App\Cms\Permissions;

use App\Models\User;
use Illuminate\Contracts\Auth\Access\Gate;
use Illuminate\Contracts\Foundation\Application;
use Spatie\Permission\Models\Permission as SpatiePermission;

/**
 * The ability map shared with the frontend (`auth.can`).
 *
 * It is generated from the permission table, so an addon that seeds a new
 * permission shows up in the UI without a frontend change. The client uses it
 * to hide affordances; the server still authorizes every mutation.
 */
final class AbilityMap
{
    public function __construct(private readonly Application $app) {}

    /**
     * @return array<string, bool>
     */
    public function for(?User $user): array
    {
        if ($user === null || ! $user->isActive()) {
            return [];
        }

        if (! $this->app->bound(Gate::class)) {
            return [];
        }

        $gate = $this->app->make(Gate::class);
        $abilities = [];

        foreach ($this->permissions() as $permission) {
            $abilities[$permission] = $gate->forUser($user)->allows($permission);
        }

        return $abilities;
    }

    /**
     * @return list<string>
     */
    public function permissions(): array
    {
        try {
            return SpatiePermission::query()->orderBy('name')->pluck('name')->all();
        } catch (\Throwable) {
            return [];
        }
    }
}
