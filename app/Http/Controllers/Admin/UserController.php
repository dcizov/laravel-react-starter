<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InviteUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $search = trim((string) $request->query('q', ''));

        $users = User::query()
            ->with('roles')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roleName(),
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
                'is_self' => $user->is($request->user()),
                'urls' => [
                    'update' => route('admin.users.update', $user),
                    'delete' => route('admin.users.destroy', $user),
                ],
            ]);

        $invitations = Invitation::query()
            ->whereNull('accepted_at')
            ->where('expires_at', '>', Carbon::now())
            ->latest('id')
            ->get()
            ->map(fn (Invitation $invitation): array => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'expires_at' => $invitation->expires_at->toIso8601String(),
                'urls' => ['destroy' => route('admin.invitations.destroy', $invitation)],
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'invitations' => $invitations,
            'filters' => ['q' => $search],
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'can' => [
                'invite' => $request->user()?->can('users.manage') ?? false,
                'manage' => $request->user()?->can('users.manage') ?? false,
            ],
        ]);
    }

    public function invite(InviteUserRequest $request): RedirectResponse
    {
        ['invitation' => $invitation, 'token' => $token] = Invitation::createFor(
            $request->validated('email'),
            $request->validated('role'),
            $request->user(),
        );

        Notification::route('mail', $invitation->email)
            ->notify(new InvitationNotification($invitation, $token));

        activity('users')
            ->event('invited')
            ->withProperties(['email' => $invitation->email, 'role' => $invitation->role])
            ->log('Invited '.$invitation->email.' as '.$invitation->role);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Invitation sent to {$invitation->email}.",
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $actor = $request->user();

        if (array_key_exists('role', $validated) && $validated['role'] !== $user->roleName()) {
            if ($user->isLastAdmin() && $validated['role'] !== 'Admin') {
                throw ValidationException::withMessages([
                    'role' => 'The last administrator keeps the Admin role.',
                ]);
            }

            $user->syncRoles([$validated['role']]);
        }

        if (array_key_exists('is_active', $validated)) {
            $active = (bool) $validated['is_active'];

            if (! $active && $user->is($actor)) {
                throw ValidationException::withMessages([
                    'is_active' => 'You cannot deactivate your own account.',
                ]);
            }

            if (! $active && $user->isLastAdmin()) {
                throw ValidationException::withMessages([
                    'is_active' => 'The last administrator must stay active.',
                ]);
            }

            $user->update(['is_active' => $active]);
        }

        if (array_key_exists('name', $validated)) {
            $user->update(['name' => $validated['name']]);
        }

        activity('users')
            ->performedOn($user)
            ->event('updated')
            ->withProperties(['changed' => array_keys($validated)])
            ->log('Updated '.$user->email);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "{$user->name} updated.",
        ]);
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'user' => 'You cannot delete your own account here.',
            ]);
        }

        activity('users')
            ->performedOn($user)
            ->event('deleted')
            ->log('Removed '.$user->email);

        $user->delete();

        return back()->with('toast', [
            'type' => 'success',
            'message' => "{$user->email} removed.",
        ]);
    }
}
