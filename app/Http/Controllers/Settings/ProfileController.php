<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Support\PublicUploads;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
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

        // Both new pictures are stored before any old one is removed or anything is saved, so a failure
        // leaves the current pictures in place.
        $newAvatar = $request->hasFile('avatar')
            ? PublicUploads::storeOrFail($request->file('avatar'), 'avatars', 'avatar')
            : null;

        try {
            $newHeader = $request->hasFile('header')
                ? PublicUploads::storeOrFail($request->file('header'), 'headers', 'header')
                : null;
        } catch (ValidationException $exception) {
            // The avatar was stored before the header failed, so it is removed again.
            if ($newAvatar !== null) {
                Storage::disk('public')->delete($newAvatar);
            }

            throw $exception;
        }

        if ($request->hasFile('avatar') || $request->boolean('remove_avatar')) {
            $previousAvatar = $user->avatar_path;
            $user->avatar_path = $newAvatar;

            if ($previousAvatar) {
                Storage::disk('public')->delete($previousAvatar);
            }
        }

        if ($request->hasFile('header') || $request->boolean('remove_header')) {
            $previousHeader = $user->header_path;
            $user->header_path = $newHeader;

            if ($previousHeader) {
                Storage::disk('public')->delete($previousHeader);
            }
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
