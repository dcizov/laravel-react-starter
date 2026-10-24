<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\Admin\PageController;
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
    Route::inertia('/', 'dashboard')->name('dashboard');

    Route::get('users', [UserController::class, 'index'])->name('admin.users.index');
    Route::post('users/invitations', [UserController::class, 'invite'])->name('admin.users.invite');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
    Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy'])->name('admin.invitations.destroy');

    Route::get('activity', [ActivityController::class, 'index'])->name('admin.activity.index');

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
