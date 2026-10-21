<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Lets an administrator sign in as another user, for support. Every start and stop is
 * recorded in the audit log. The administrator's own id is kept in the session until
 * they stop, so they return to their account.
 */
class ImpersonationController extends Controller
{
    public const SESSION_KEY = 'impersonator_id';

    public function start(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->can(Rbac::PERMISSION_USERS_IMPERSONATE), 403);

        // Nested impersonation would make the audit trail hard to follow, so it is not allowed.
        abort_if($request->session()->has(self::SESSION_KEY), 403);

        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => __('You cannot impersonate yourself.')]);
        }

        if ($user->hasRole('admin')) {
            throw ValidationException::withMessages(['user' => __('Admins cannot be impersonated.')]);
        }

        if ($user->isSuspended()) {
            throw ValidationException::withMessages(['user' => __('Suspended accounts cannot be impersonated.')]);
        }

        // Recorded before the switch, so the entry names the administrator as the actor.
        AuditLog::record('user.impersonation_started', $user, [], $request);

        $request->session()->put(self::SESSION_KEY, $request->user()->id);
        Auth::login($user);
        $request->session()->regenerate();

        return to_route('dashboard');
    }

    public function stop(Request $request): RedirectResponse
    {
        $adminId = $request->session()->get(self::SESSION_KEY);

        abort_unless($adminId, 404);

        // Recorded while still signed in as the impersonated user, with the admin as impersonator.
        AuditLog::record('user.impersonation_stopped', $request->user(), [], $request);

        $request->session()->forget(self::SESSION_KEY);
        Auth::loginUsingId($adminId);
        $request->session()->regenerate();

        return to_route('admin.users.index');
    }
}
