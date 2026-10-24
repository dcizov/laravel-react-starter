<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\AddonController;
use App\Http\Controllers\Admin\AppearanceController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin routes
|--------------------------------------------------------------------------
|
| Every route is behind auth + verified + active. Authorization is enforced
| per action by policies and FormRequests, never by the middleware alone.
|
*/

Route::middleware(['auth', 'verified', 'active'])->prefix('admin')->group(function (): void {
    Route::get('/', DashboardController::class)->name('dashboard');

    Route::get('users', [UserController::class, 'index'])->name('admin.users.index');
    Route::post('users/invitations', [UserController::class, 'invite'])->name('admin.users.invite');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
    Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy'])->name('admin.invitations.destroy');

    Route::get('activity', [ActivityController::class, 'index'])->name('admin.activity.index');

    Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('admin.notifications.read-all');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'read'])->name('admin.notifications.read');

    Route::get('settings', [SettingsController::class, 'index'])->name('admin.settings.index');
    Route::get('settings/{group}', [SettingsController::class, 'show'])->name('admin.settings.show');
    Route::patch('settings/{group}', [SettingsController::class, 'update'])->name('admin.settings.update');

    Route::get('addons', [AddonController::class, 'index'])->name('admin.addons.index');
    Route::post('addons/{handle}/install', [AddonController::class, 'install'])->name('admin.addons.install');
    Route::post('addons/{handle}/activate', [AddonController::class, 'activate'])->name('admin.addons.activate');
    Route::post('addons/{handle}/deactivate', [AddonController::class, 'deactivate'])->name('admin.addons.deactivate');
    Route::delete('addons/{handle}', [AddonController::class, 'uninstall'])->name('admin.addons.uninstall');

    Route::get('appearance', [AppearanceController::class, 'index'])->name('admin.appearance.index');
    Route::post('appearance/{handle}/activate', [AppearanceController::class, 'activate'])->name('admin.appearance.activate');

    Route::get('media', [MediaController::class, 'index'])->name('admin.media.index');
    Route::post('media', [MediaController::class, 'upload'])->name('admin.media.upload');
    Route::get('media/browse', [MediaController::class, 'browse'])->name('admin.media.browse');
    Route::patch('media/{media}', [MediaController::class, 'update'])->name('admin.media.update');
    Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('admin.media.destroy');
    Route::post('media/{id}/restore', [MediaController::class, 'restore'])->whereNumber('id')->name('admin.media.restore');
    Route::post('media/folders', [MediaController::class, 'storeFolder'])->name('admin.media.folders.store');
    Route::patch('media/folders/{folder}', [MediaController::class, 'updateFolder'])->name('admin.media.folders.update');
    Route::delete('media/folders/{folder}', [MediaController::class, 'destroyFolder'])->name('admin.media.folders.destroy');

    Route::get('pages', [PageController::class, 'index'])->name('admin.pages.index');
    Route::get('pages/create', [PageController::class, 'create'])->name('admin.pages.create');
    Route::post('pages', [PageController::class, 'store'])->name('admin.pages.store');
    Route::get('pages/{page}/edit', [PageController::class, 'edit'])->name('admin.pages.edit');
    Route::patch('pages/{page}', [PageController::class, 'update'])->name('admin.pages.update');
    Route::patch('pages/{page}/autosave', [PageController::class, 'autosave'])->name('admin.pages.autosave');
    Route::post('pages/{page}/publish', [PageController::class, 'publish'])->name('admin.pages.publish');
    Route::post('pages/{page}/unpublish', [PageController::class, 'unpublish'])->name('admin.pages.unpublish');
    Route::post('pages/{page}/schedule', [PageController::class, 'schedule'])->name('admin.pages.schedule');
    Route::post('pages/{page}/duplicate', [PageController::class, 'duplicate'])->name('admin.pages.duplicate');
    Route::delete('pages/{page}', [PageController::class, 'destroy'])->name('admin.pages.destroy');
    Route::post('pages/{page}/restore', [PageController::class, 'restore'])->name('admin.pages.restore');
    Route::post('pages/{page}/revisions/{revision}/restore', [PageController::class, 'restoreRevision'])->name('admin.pages.revisions.restore');
});
