<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->fill($request->safe()->except(['avatar', 'remove_avatar', 'header', 'remove_header']));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        if ($request->hasFile('avatar') || $request->boolean('remove_avatar')) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            $user->avatar_path = $request->hasFile('avatar')
                ? $request->file('avatar')->store('avatars', 'public')
                : null;
        }

        if ($request->hasFile('header') || $request->boolean('remove_header')) {
            if ($user->header_path) {
                Storage::disk('public')->delete($user->header_path);
            }

            $user->header_path = $request->hasFile('header')
                ? $request->file('header')->store('headers', 'public')
                : null;
        }

        $user->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Profile updated.'),
            'description' => __('Your changes are visible on your profile.'),
            'action' => [
                'label' => __('View profile'),
                'url' => route('user-profile.show'),
            ],
        ]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
