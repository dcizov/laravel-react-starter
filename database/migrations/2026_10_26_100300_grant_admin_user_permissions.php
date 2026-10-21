<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

// Adds the admin user-management permissions to the existing admin role. Only these permissions are
// touched, so changes an administrator made on the Roles page are kept. The full Rbac::sync() is not
// used here because it resets every role to the defaults in code.
return new class extends Migration
{
    private const PERMISSIONS = ['users.manage', 'users.impersonate', 'audit.view'];

    public function up(): void
    {
        $role = Role::query()->where('name', 'admin')->where('guard_name', 'web')->first();

        if (! $role) {
            return;
        }

        foreach (self::PERMISSIONS as $name) {
            $permission = Permission::findOrCreate($name, 'web');
            $role->givePermissionTo($permission);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Left in place on rollback: other roles or users may depend on these permissions.
    }
};
