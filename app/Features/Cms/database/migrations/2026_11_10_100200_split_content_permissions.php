<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

// Replaces the single content.manage permission with granular ones (see App\Support\Rbac).
//
// - Every role that had content.manage gets the full set of content permissions, so existing editors keep access.
// - Roles that could change app settings also get sites.manage, because sites change where content is published.
// - Two starter roles are added, editor and author. They can be edited in the roles screen like any other role.
// - content.manage is then removed. Spatie removes it from every role that still referenced it.
return new class extends Migration
{
    /** @var list<string> */
    private const EDITOR_PERMISSIONS = [
        'content.view',
        'content.create',
        'content.edit-any',
        'content.publish',
        'content.delete',
        'comments.moderate',
    ];

    /** @var list<string> */
    private const AUTHOR_PERMISSIONS = [
        'content.view',
        'content.create',
        'content.edit-own',
    ];

    public function up(): void
    {
        $registrar = app(PermissionRegistrar::class);

        foreach ([...self::EDITOR_PERMISSIONS, 'content.edit-own', 'sites.manage'] as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $registrar->forgetCachedPermissions();

        $legacy = Permission::query()->where('name', 'content.manage')->where('guard_name', 'web')->first();

        if ($legacy) {
            foreach ($legacy->roles as $role) {
                $role->givePermissionTo([...self::EDITOR_PERMISSIONS, 'content.edit-own']);

                if ($role->hasPermissionTo('settings.manage')) {
                    $role->givePermissionTo('sites.manage');
                }
            }
        }

        $admin = Role::query()->where('name', 'admin')->where('guard_name', 'web')->first();

        if ($admin) {
            $admin->givePermissionTo([...self::EDITOR_PERMISSIONS, 'content.edit-own', 'sites.manage']);
        }

        Role::findOrCreate('editor', 'web')->syncPermissions(self::EDITOR_PERMISSIONS);
        Role::findOrCreate('author', 'web')->syncPermissions(self::AUTHOR_PERMISSIONS);

        $legacy?->delete();

        $registrar->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Not reversed. Restoring content.manage would silently give back a permission that is now split.
    }
};
