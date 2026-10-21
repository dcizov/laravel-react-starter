<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Settings\AppSettings;
use App\Support\Rbac;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    /**
     * Every role with how many permissions it has and how many users have it.
     */
    public function index(): Response
    {
        $roles = Role::query()
            ->withCount(['permissions', 'users'])
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions_count' => $role->permissions_count,
                'users_count' => $role->users_count,
                'system' => $this->isSystem($role),
            ]);

        return Inertia::render('admin/roles/index', ['roles' => $roles]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/roles/form', $this->formProps(null));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $role = Role::create(['name' => $validated['name']]);
        $role->syncPermissions($validated['permissions'] ?? []);

        $this->flush();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return to_route('admin.roles.index');
    }

    public function edit(Role $role): Response
    {
        return Inertia::render('admin/roles/form', $this->formProps($role));
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate($this->rules($role));

        if ($role->name === app(AppSettings::class)->default_role && $validated['name'] !== $role->name) {
            return back()->withErrors([
                'name' => __('This role is the default for new accounts. Choose another default first.'),
            ]);
        }

        // System roles keep their name. The admin role always has every permission.
        if (! $this->isSystem($role)) {
            $role->update(['name' => $validated['name']]);
        }

        $role->syncPermissions(
            // Permissions of disabled features are not in the form, so keep the ones the role already has.
            $role->name === 'admin'
                ? Rbac::permissions()
                : [...($validated['permissions'] ?? []), ...$role->permissions->pluck('name')->diff(Rbac::permissions())->all()],
        );

        $this->flush();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return to_route('admin.roles.index');
    }

    public function destroy(Role $role): RedirectResponse
    {
        abort_if($this->isSystem($role), 403);

        if ($role->name === app(AppSettings::class)->default_role) {
            return back()->withErrors([
                'role' => __('This role is the default for new accounts. Choose another default first.'),
            ]);
        }

        if ($role->users()->exists()) {
            return back()->withErrors([
                'role' => __('Remove this role from all users before deleting it.'),
            ]);
        }

        $role->delete();

        $this->flush();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return to_route('admin.roles.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function formProps(?Role $role): array
    {
        return [
            'role' => $role ? [
                'id' => $role->id,
                'name' => $role->name,
                'system' => $this->isSystem($role),
            ] : null,
            'permissions' => Permission::query()->whereIn('name', Rbac::permissions())->orderBy('name')->pluck('name')->values(),
            'granted' => $role ? $role->permissions->pluck('name')->intersect(Rbac::permissions())->values() : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Role $role = null): array
    {
        $nameRules = match (true) {
            $role !== null && $this->isSystem($role) => ['required', Rule::in([$role->name])],
            default => [
                'required',
                'string',
                'max:50',
                'regex:/^[a-z0-9_-]+$/',
                Rule::unique('roles', 'name')->ignore($role?->id),
            ],
        };

        return [
            'name' => $nameRules,
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(Rbac::permissions())],
        ];
    }

    private function isSystem(Role $role): bool
    {
        return in_array($role->name, Rbac::SYSTEM_ROLES, true);
    }

    private function flush(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
