<?php

declare(strict_types=1);

namespace App\Cms\Permissions;

use App\Cms\Manifests\AddonManifest;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Throwable;

/**
 * Keeps the permission table in step with the role matrix and with what is
 * installed. Activation of an addon must make its abilities usable immediately,
 * without asking the operator to re-run the seeder.
 */
final class PermissionSync
{
    public function syncAddon(AddonManifest $manifest): void
    {
        foreach ($manifest->permissions as $permission) {
            if (is_string($permission)) {
                $this->ensure($permission);
            }
        }
    }

    public function ensure(string $permission): void
    {
        try {
            Permission::findOrCreate($permission, 'web');

            $admin = Role::findByName('Admin', 'web');

            if (! $admin->hasPermissionTo($permission)) {
                $admin->givePermissionTo($permission);
            }

            app(PermissionRegistrar::class)->forgetCachedPermissions();
        } catch (Throwable) {
            // Roles may not be seeded yet (fresh install); the seeder will
            // create this permission from the manifest instead.
        }
    }
}
