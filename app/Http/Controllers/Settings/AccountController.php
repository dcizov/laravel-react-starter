<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AccountSettingsUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AccountController extends Controller
{
    /**
     * Show the account settings page, including the security options.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $user = $request->user();

        $props = [
            'settings' => [
                'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
                'language' => $user->locale ?? 'en',
                'timezone' => $user->timezone,
            ],
            'canManageTwoFactor' => Features::canManageTwoFactorAuthentication(),
            'canManagePasskeys' => Features::canManagePasskeys(),
            'passkeys' => Features::canManagePasskeys()
                ? $user
                    ->passkeys()
                    ->select(['id', 'name', 'credential', 'created_at', 'last_used_at'])
                    ->latest()
                    ->get()
                    ->map(fn ($passkey) => [
                        'id' => $passkey->id,
                        'name' => $passkey->name,
                        'authenticator' => $passkey->authenticator,
                        'created_at_diff' => $passkey->created_at->diffForHumans(),
                        'last_used_at_diff' => $passkey->last_used_at?->diffForHumans(),
                    ])
                    ->values()
                    ->all()
                : [],
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ];

        if (Features::canManageTwoFactorAuthentication()) {
            $request->ensureStateIsValid();

            $props['twoFactorEnabled'] = $user->hasEnabledTwoFactorAuthentication();
            $props['requiresConfirmation'] = Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm');
        }

        return Inertia::render('settings/account', $props);
    }

    public function update(AccountSettingsUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'date_of_birth' => $request->validated('date_of_birth'),
            'locale' => $request->validated('locale'),
            'timezone' => $request->validated('timezone'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account settings updated.')]);

        return to_route('account.edit');
    }
}
