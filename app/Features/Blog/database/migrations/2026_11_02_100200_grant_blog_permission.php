<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

// Adds blog.manage to the existing admin role only. Rbac::sync() is not used, as with the other grant migrations.
return new class extends Migration
{
    public function up(): void
    {
        $role = Role::query()->where('name', 'admin')->where('guard_name', 'web')->first();

        if (! $role) {
            return;
        }

        $role->givePermissionTo(Permission::findOrCreate('blog.manage', 'web'));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Left in place on rollback, as with the other grant migrations.
    }
};
