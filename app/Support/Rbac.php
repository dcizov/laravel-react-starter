<?php

namespace App\Support;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class Rbac
{
    public const PERMISSION_TASKS_VIEW_ANY = 'tasks.view-any';

    public const PERMISSION_TASKS_UPDATE_ANY = 'tasks.update-any';

    public const PERMISSION_TASKS_DELETE_ANY = 'tasks.delete-any';

    public const PERMISSION_USERS_VIEW = 'users.view';

    public const PERMISSION_USERS_MANAGE_ROLES = 'users.manage-roles';

    public const PERMISSION_ROLES_MANAGE = 'roles.manage';

    public const PERMISSION_PERMISSIONS_MANAGE = 'permissions.manage';

    public const PERMISSION_SETTINGS_MANAGE = 'settings.manage';

    /**
     * Every permission the application checks.
     *
     * @var list<string>
     */
    public const PERMISSIONS = [
        self::PERMISSION_TASKS_VIEW_ANY,
        self::PERMISSION_TASKS_UPDATE_ANY,
        self::PERMISSION_TASKS_DELETE_ANY,
        self::PERMISSION_USERS_VIEW,
        self::PERMISSION_USERS_MANAGE_ROLES,
        self::PERMISSION_ROLES_MANAGE,
        self::PERMISSION_PERMISSIONS_MANAGE,
        self::PERMISSION_SETTINGS_MANAGE,
    ];

    /**
     * The roles and the permissions each one has.
     *
     * @var array<string, list<string>>
     */
    public const ROLES = [
        'admin' => self::PERMISSIONS,
        'user' => [],
    ];

    /**
     * Roles the app depends on. They cannot be renamed or deleted, and the admin role always has every permission.
     *
     * @var list<string>
     */
    public const SYSTEM_ROLES = ['admin', 'user'];

    /**
     * The role every new account gets.
     */
    public const DEFAULT_ROLE = 'user';

    /**
     * Create the permissions and roles above, and give each role exactly the permissions listed here.
     */
    public static function sync(): void
    {
        $registrar = app(PermissionRegistrar::class);

        foreach (self::PERMISSIONS as $name) {
            Permission::findOrCreate($name);
        }

        // Spatie caches the permission list. Clear it so the roles below see the rows just created.
        $registrar->forgetCachedPermissions();

        foreach (self::ROLES as $name => $permissions) {
            Role::findOrCreate($name)->syncPermissions($permissions);
        }

        $registrar->forgetCachedPermissions();
    }
}
