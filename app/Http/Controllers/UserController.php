<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

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
            && User::query()->whereHas('roles', fn ($query) => $query->where('name', 'admin'))->count() === 1;

        if ($isLastAdmin) {
            throw ValidationException::withMessages([
                'role' => __('At least one admin must remain.'),
            ]);
        }

        $user->roles()->sync([Role::query()->where('name', $role)->firstOrFail()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User role updated.')]);

        return to_route('users.index');
    }
}
