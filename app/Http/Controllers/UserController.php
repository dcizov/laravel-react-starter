<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Every account with its role. Only shown to users with the users.view permission.
     */
    public function index(): Response
    {
        $users = User::query()
            ->with('roles:id,name')
            ->orderBy('id')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name ?? Rbac::DEFAULT_ROLE,
            ]);

        return Inertia::render('users', [
            'users' => $users,
            'roles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    /**
     * Give a user one role in place of their current roles.
     */
    public function updateRole(Request $request, User $user): RedirectResponse
    {
        Gate::authorize(Rbac::PERMISSION_USERS_MANAGE_ROLES);

        $validated = $request->validate([
            'role' => ['required', Rule::exists('roles', 'name')],
        ]);

        $role = $validated['role'];

        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'role' => __('You cannot change your own role.'),
            ]);
        }

        $isLastAdmin = $user->hasRole('admin')
            && $role !== 'admin'
            && User::role('admin')->count() === 1;

        if ($isLastAdmin) {
            throw ValidationException::withMessages([
                'role' => __('At least one admin must remain.'),
            ]);
        }

        $user->syncRoles($role);

        AuditLog::record('user.role_changed', $user, ['role' => $role], $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User role updated.')]);

        return to_route('users.index');
    }

    /**
     * Give several users the same role at once, from the bulk action on the Users table.
     */
    public function bulkUpdateRole(Request $request): RedirectResponse
    {
        Gate::authorize(Rbac::PERMISSION_USERS_MANAGE_ROLES);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', Rule::exists('users', 'id')],
            'role' => ['required', Rule::exists('roles', 'name')],
        ]);

        $role = $validated['role'];
        $users = User::query()->whereIn('id', $validated['ids'])->get();

        if ($users->contains(fn (User $user) => $user->is($request->user()))) {
            throw ValidationException::withMessages([
                'role' => __('You cannot change your own role.'),
            ]);
        }

        // Admins who lose the admin role in this change. At least one admin must remain.
        $adminsLeaving = $role === 'admin'
            ? 0
            : $users->filter(fn (User $user) => $user->hasRole('admin'))->count();

        if ($adminsLeaving > 0 && User::role('admin')->count() <= $adminsLeaving) {
            throw ValidationException::withMessages([
                'role' => __('At least one admin must remain.'),
            ]);
        }

        DB::transaction(fn () => $users->each(fn (User $user) => $user->syncRoles($role)));

        AuditLog::record('user.roles_changed', null, [
            'role' => $role,
            'user_ids' => $users->pluck('id')->values()->all(),
        ], $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User roles updated.')]);

        return to_route('users.index');
    }
}
