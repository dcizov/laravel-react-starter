<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

// Comment moderation now uses content.manage, which the cms feature owns. blog.manage is removed.
return new class extends Migration
{
    public function up(): void
    {
        Permission::query()->where('name', 'blog.manage')->where('guard_name', 'web')->get()->each->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Left removed on rollback; the grant migration in the blog feature recreates it if needed.
    }
};
