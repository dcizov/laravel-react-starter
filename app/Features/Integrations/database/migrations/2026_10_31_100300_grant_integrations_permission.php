<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

// Adds integrations.manage to the existing admin role only, as the landing grant does. Runs when the feature is enabled.
return new class extends Migration
{
    public function up(): void
    {
        $role = Role::query()->where('name', 'admin')->where('guard_name', 'web')->first();

        if (! $role) {
            return;
        }

        $role->givePermissionTo(Permission::findOrCreate('integrations.manage', 'web'));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Left in place on rollback, as with the other grant migrations.
    }
};
