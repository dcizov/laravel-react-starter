<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AccountSettingsUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Support\Locales;
use App\Support\Timezones;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\App;
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

        $language = Locales::resolve($user->locale);

        $props = [
            'settings' => [
                'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
                'language' => $language,
                'timezone' => $user->timezone ?? Timezones::defaultFor($language),
            ],
            'languages' => Locales::options(),
            'timezones' => Timezones::ZONES,
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

        // Switch to the new language first so the confirmation is shown in it.
        App::setLocale($request->validated('locale'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account settings updated.')]);

        return to_route('account.edit');
    }
}
