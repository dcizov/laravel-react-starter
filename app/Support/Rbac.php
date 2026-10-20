<?php

namespace App\Support;

use App\Models\Permission;
use App\Models\Role;

final class Rbac
{
    public const PERMISSION_TASKS_VIEW_ANY = 'tasks.view-any';

    public const PERMISSION_TASKS_UPDATE_ANY = 'tasks.update-any';

    public const PERMISSION_TASKS_DELETE_ANY = 'tasks.delete-any';

    public const PERMISSION_USERS_VIEW = 'users.view';

    public const PERMISSION_USERS_MANAGE_ROLES = 'users.manage-roles';

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
     * The role every new account gets.
     */
    public const DEFAULT_ROLE = 'user';

    /**
     * Create the roles and permissions above, and set each role's permissions to the list here.
     */
    public static function sync(): void
    {
        foreach (self::PERMISSIONS as $name) {
            Permission::query()->firstOrCreate(['name' => $name]);
        }

        foreach (self::ROLES as $name => $permissions) {
            $role = Role::query()->firstOrCreate(['name' => $name]);

            $role->permissions()->sync(
                Permission::query()->whereIn('name', $permissions)->pluck('id'),
            );
        }
    }
}
