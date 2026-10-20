<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AccountSettingsUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/account', [
            'settings' => [
                'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
                'language' => $user->locale ?? 'en',
            ],
        ]);
    }

    public function update(AccountSettingsUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'date_of_birth' => $request->validated('date_of_birth'),
            'locale' => $request->validated('locale'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account settings updated.')]);

        return to_route('account.edit');
    }
}
