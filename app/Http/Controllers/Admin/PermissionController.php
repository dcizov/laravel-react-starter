<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Rbac;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionController extends Controller
{
    /**
     * Every permission. Built-in ones are the ones the app checks; they cannot be renamed or deleted.
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
                'built_in' => $this->isBuiltIn($permission),
            ]);

        return Inertia::render('admin/permissions/index', ['permissions' => $permissions]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => $this->nameRules(),
        ]);

        $permission = Permission::create(['name' => $validated['name']]);

        // The admin role always has every permission, including custom ones.
        Role::findByName('admin')->givePermissionTo($permission);

        $this->flush();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Permission created.')]);

        return to_route('admin.permissions.index');
    }

    public function update(Request $request, Permission $permission): RedirectResponse
    {
        abort_if($this->isBuiltIn($permission), 403);

        $validated = $request->validate([
            'name' => $this->nameRules($permission),
        ]);

        $permission->update(['name' => $validated['name']]);

        $this->flush();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Permission updated.')]);

        return to_route('admin.permissions.index');
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        abort_if($this->isBuiltIn($permission), 403);

        if ($permission->roles()->exists()) {
            return back()->withErrors([
                'name' => __('Remove this permission from all roles before deleting it.'),
            ]);
        }

        $permission->delete();

        $this->flush();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Permission deleted.')]);

        return to_route('admin.permissions.index');
    }

    /**
     * @return list<mixed>
     */
    private function nameRules(?Permission $permission = null): array
    {
        return [
            'required',
            'string',
            'max:100',
            // Lowercase words joined by dots or hyphens, for example reports.export or tasks.view-any.
            'regex:/^[a-z0-9]+([.-][a-z0-9]+)*$/',
            Rule::unique('permissions', 'name')->ignore($permission?->id),
        ];
    }

    private function isBuiltIn(Permission $permission): bool
    {
        return in_array($permission->name, Rbac::PERMISSIONS, true);
    }

    private function flush(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
