<?php

use App\Http\Controllers\Settings\AccountController;
use App\Http\Controllers\Settings\DisplayController;
use App\Http\Controllers\Settings\NotificationsController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    // TODO: Revert to Route::redirect once https://github.com/laravel/wayfinder/issues/326 is fixed.
    Route::get('settings', fn () => redirect('/settings/profile'));

    // Old settings URLs. General and Security now live on the account page.
    Route::get('settings/general', fn () => redirect()->route('account.edit'));
    Route::get('settings/security', fn () => redirect()->route('account.edit'));

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::patch('settings/account', [AccountController::class, 'update'])->name('account.update');

    Route::get('settings/display', [DisplayController::class, 'edit'])->name('display.edit');
    Route::patch('settings/display', [DisplayController::class, 'update'])->name('display.update');

    Route::get('settings/notifications', [NotificationsController::class, 'edit'])->name('notifications.edit');
    Route::patch('settings/notifications', [NotificationsController::class, 'update'])->name('notifications.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/account', [AccountController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('account.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('account.edit'),
        'manage' => route('account.edit'),
    ]);
})->name('well-known.passkeys');
