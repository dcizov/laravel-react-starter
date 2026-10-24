<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\InvitationController;
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
});
