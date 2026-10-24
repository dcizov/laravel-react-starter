<?php

use App\Http\Controllers\Auth\InvitationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

require __DIR__.'/admin.php';

// Invite-only signup: the token identifies the invitation, the email is fixed.
Route::get('invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
Route::post('invitations/{token}', [InvitationController::class, 'store'])->name('invitations.store');

require __DIR__.'/settings.php';
