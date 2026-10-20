<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Notifications\PasswordChangedNotification;
use App\Support\NotificationSettings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class SecurityController extends Controller
{
    /**
     * Update the user's password.
     *
     * The form lives on the account settings page, so this redirects back to it.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->update([
            'password' => $request->password,
        ]);

        if (NotificationSettings::wantsEmail($user, 'security_emails')) {
            $user->notify(new PasswordChangedNotification);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }
}
