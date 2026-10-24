<?php

declare(strict_types=1);

namespace App\Cms\Permissions;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission as SpatiePermission;
use Throwable;

/**
 * The ability map shared with the frontend (`auth.can`).
 *
 * It is generated from the permission table, so an addon that seeds a new
 * permission shows up in the UI without a frontend change. The client uses it
 * to hide affordances; the server still authorizes every mutation.
 *
 * Two queries: the permission list and one union of the user's role and direct
 * grants. Asking the gate per permission cost five queries and ran on every
 * admin screen.
 */
final class AbilityMap
{
    /** @var array<int, array<string, bool>> */
    private array $memo = [];

    /**
     * @return array<string, bool>
     */
    public function for(?User $user): array
    {
        if ($user === null || ! $user->isActive()) {
            return [];
        }

        if (isset($this->memo[$user->getKey()])) {
            return $this->memo[$user->getKey()];
        }

        $granted = $this->grantedPermissionIds($user);

        $abilities = [];

        foreach ($this->permissionRows() as $permission) {
            $abilities[$permission->name] = in_array($permission->id, $granted, true);
        }

        return $this->memo[$user->getKey()] = $abilities;
    }

    /**
     * @return list<string>
     */
    public function permissions(): array
    {
        return array_map(fn ($permission): string => $permission->name, $this->permissionRows());
    }

    /**
     * @return list<SpatiePermission>
     */
    private function permissionRows(): array
    {
        try {
            return SpatiePermission::query()->orderBy('name')->get(['id', 'name'])->all();
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return list<int>
     */
    private function grantedPermissionIds(User $user): array
    {
        try {
            $viaRoles = DB::table('model_has_roles')
                ->join('role_has_permissions', 'role_has_permissions.role_id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $user->getKey())
                ->where('model_has_roles.model_type', $user->getMorphClass())
                ->select('role_has_permissions.permission_id');

            $direct = DB::table('model_has_permissions')
                ->where('model_id', $user->getKey())
                ->where('model_type', $user->getMorphClass())
                ->select('model_has_permissions.permission_id');

            return $viaRoles->union($direct)->pluck('permission_id')
                ->map(fn ($id): int => (int) $id)
                ->all();
        } catch (Throwable) {
            // A fresh clone has no permission tables yet.
            return [];
        }
    }
}
