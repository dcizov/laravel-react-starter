<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * User management for administrators: edit, verify, suspend, reset passwords, delete, and export.
 * Every route in this controller is behind the users.manage permission.
 */
class UserManagementController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->with('roles:id,name')
            ->withCount('tasks')
            ->orderBy('id')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name ?? Rbac::DEFAULT_ROLE,
                'verified' => $user->hasVerifiedEmail(),
                'verifiedAt' => $user->email_verified_at?->toIso8601String(),
                'suspended' => $user->isSuspended(),
                'createdAt' => $user->created_at?->toIso8601String(),
                'tasksCount' => $user->tasks_count,
            ]);

        return Inertia::render('admin/users', [
            'users' => $users,
            'roles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $emailChanged = $validated['email'] !== $user->email;

        $user->fill($validated);

        // A new address has not been confirmed yet, so the account is unverified again.
        if ($emailChanged) {
            $user->email_verified_at = null;
        }

        $user->save();

        AuditLog::record('user.updated', $user, [
            'fields' => array_values(array_diff(array_keys($user->getChanges()), ['updated_at'])),
        ], $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return back();
    }

    public function verifyEmail(Request $request, User $user): RedirectResponse
    {
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();

            AuditLog::record('user.email_verified', $user, [], $request);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Email marked as verified.')]);

        return back();
    }

    public function sendPasswordReset(Request $request, User $user): RedirectResponse
    {
        $status = Password::sendResetLink(['email' => $user->email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        AuditLog::record('user.password_reset_sent', $user, [], $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password reset link sent.')]);

        return back();
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => __('You cannot suspend your own account.')]);
        }

        if ($user->hasRole('admin') && $this->otherActiveAdmins($user) === 0) {
            throw ValidationException::withMessages(['user' => __('At least one active admin must remain.')]);
        }

        $user->forceFill(['suspended_at' => now()])->save();

        AuditLog::record('user.suspended', $user, [], $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account suspended.')]);

        return back();
    }

    public function reinstate(Request $request, User $user): RedirectResponse
    {
        $user->forceFill(['suspended_at' => null])->save();

        AuditLog::record('user.reinstated', $user, [], $request);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account reinstated.')]);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => __('You cannot delete your own account.')]);
        }

        if ($user->hasRole('admin') && User::role('admin')->whereKeyNot($user->id)->count() === 0) {
            throw ValidationException::withMessages(['user' => __('At least one admin must remain.')]);
        }

        // Written before the delete, while the user row still exists to copy its details.
        AuditLog::record('user.deleted', $user, [], $request);

        // The role and permission links are removed first, so no orphaned rows are left behind.
        $user->syncRoles([]);
        $user->syncPermissions([]);
        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return to_route('admin.users.index');
    }

    /**
     * Download every account as CSV. Each export is recorded in the audit log.
     */
    public function export(Request $request): StreamedResponse
    {
        AuditLog::record('user.exported', null, ['count' => User::query()->count()], $request);

        return response()->streamDownload(function () {
            $output = fopen('php://output', 'w');

            fputcsv($output, ['id', 'name', 'email', 'role', 'email_verified_at', 'suspended', 'created_at', 'tasks']);

            User::query()
                ->with('roles:id,name')
                ->withCount('tasks')
                ->orderBy('id')
                ->chunkById(500, function ($users) use ($output) {
                    foreach ($users as $user) {
                        fputcsv($output, [
                            $user->id,
                            self::csvSafe($user->name),
                            self::csvSafe($user->email),
                            $user->roles->first()?->name ?? Rbac::DEFAULT_ROLE,
                            $user->email_verified_at?->toIso8601String() ?? '',
                            $user->isSuspended() ? 'yes' : 'no',
                            $user->created_at?->toIso8601String() ?? '',
                            $user->tasks_count,
                        ]);
                    }
                });

            fclose($output);
        }, 'users-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Active admins other than this user. Used so at least one admin can always sign in.
     */
    private function otherActiveAdmins(User $user): int
    {
        return User::role('admin')
            ->whereNull('suspended_at')
            ->whereKeyNot($user->id)
            ->count();
    }

    /**
     * Stops spreadsheet programs from running a cell that starts with a formula character.
     */
    private static function csvSafe(?string $value): string
    {
        $value ??= '';

        return preg_match('/^[=+\-@\t\r]/', $value) === 1 ? "'".$value : $value;
    }
}
