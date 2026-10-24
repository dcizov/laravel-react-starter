<?php

declare(strict_types=1);

namespace App\Addons\PostCraft;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Throwable;

/**
 * Lifecycle hooks. Activation grants the editorial roles their post abilities
 * so the addon is usable the moment it turns on; deactivation leaves every row
 * intact, which is what makes re-enabling instant and lossless.
 */
class Activator
{
    private const EDITOR = ['posts.view', 'posts.create', 'posts.update', 'posts.delete', 'posts.publish'];

    private const AUTHOR = ['posts.view', 'posts.create', 'posts.update'];

    public function activate(): void
    {
        $this->grant('Editor', self::EDITOR);
        $this->grant('Author', self::AUTHOR);
    }

    /**
     * @param  list<string>  $permissions
     */
    private function grant(string $role, array $permissions): void
    {
        try {
            // The addon's manifest permissions are registered by the manager,
            // but an activation that runs before that finishes would otherwise
            // fail with an unknown permission — so ensure them here too.
            foreach ($permissions as $permission) {
                Permission::findOrCreate($permission, 'web');
            }

            Role::findByName($role, 'web')->givePermissionTo($permissions);
        } catch (Throwable) {
            // Roles may not be seeded yet; the operator can re-run the seeder.
        }
    }
}
