<?php

use App\Http\Controllers\Auth\InvitationController;
use App\Http\Controllers\PublicPageController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicPageController::class, 'home'])->name('home');

// Signed draft previews: shareable for six hours, never indexed.
Route::get('preview/pages/{page}', [PublicPageController::class, 'preview'])
    ->middleware('signed')
    ->name('preview.pages.show');

// Machine-readable entry points. They sit above the catch-all so a page can
// never shadow them.
Route::get('sitemap.xml', [SitemapController::class, 'sitemap'])->name('sitemap');
Route::get('robots.txt', [SitemapController::class, 'robots'])->name('robots');

require __DIR__.'/admin.php';

// Invite-only signup: the token identifies the invitation, the email is fixed.
Route::get('invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
Route::post('invitations/{token}', [InvitationController::class, 'store'])->name('invitations.store');

require __DIR__.'/settings.php';

// Published pages live at the root. Keep this last: it is the catch-all, and it
// must not shadow a real route with the same first segment (a POST to /register
// would otherwise answer 405 instead of 404).
$reserved = [
    'admin', 'api', 'build', 'email', 'invitations', 'login', 'logout', 'password',
    'preview', 'register', 'settings', 'storage', 'two-factor', 'up', 'user', 'verify',
];

Route::get('{slug}', [PublicPageController::class, 'show'])
    ->where('slug', '^(?!('.implode('|', $reserved).')$)[a-z0-9][a-z0-9\-]*$')
    ->name('pages.show');
