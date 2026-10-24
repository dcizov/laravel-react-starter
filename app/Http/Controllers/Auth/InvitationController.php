<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Invite-only signup. The invitee sets a name and password; the role and
 * email come from the invitation, never from the form.
 */
class InvitationController extends Controller
{
    public function show(string $token): Response
    {
        $invitation = $this->resolve($token);

        return Inertia::render('auth/accept-invitation', [
            'token' => $token,
            'email' => $invitation->email,
            'role' => $invitation->role,
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $invitation = $this->resolve($token);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if (User::query()->where('email', $invitation->email)->exists()) {
            throw ValidationException::withMessages([
                'email' => 'An account already exists for this invitation.',
            ]);
        }

        $user = DB::transaction(function () use ($validated, $invitation): User {
            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $invitation->email,
                'password' => $validated['password'],
                'email_verified_at' => now(),
                'is_active' => true,
            ]);

            $user->assignRole($invitation->role);

            $invitation->forceFill(['accepted_at' => now()])->save();

            return $user;
        });

        activity('users')
            ->performedOn($user)
            ->event('accepted-invitation')
            ->log('Accepted the invitation for '.$user->email);

        Auth::login($user);

        return redirect()->route('dashboard')->with('toast', [
            'type' => 'success',
            'message' => 'Welcome to '.config('app.name').'.',
        ]);
    }

    private function resolve(string $token): Invitation
    {
        $invitation = Invitation::findByToken($token);

        if ($invitation === null || ! $invitation->isPending()) {
            abort(404, 'This invitation is no longer valid.');
        }

        return $invitation;
    }
}
