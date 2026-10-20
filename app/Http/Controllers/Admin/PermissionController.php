<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Every permission the app defines. Permissions are declared in App\Support\Rbac and
     * created by RbacSeeder, so they are read-only here: a permission is only useful when
     * code checks it.
     */
    public function index(): Response
    {
        $permissions = Permission::query()
            ->withCount('roles')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'roles_count' => $permission->roles_count,
            ]);

        return Inertia::render('admin/permissions/index', ['permissions' => $permissions]);
    }
}
