<?php

use App\Features\Landing\Http\Controllers\Admin\LandingController as AdminLandingController;
use Illuminate\Support\Facades\Route;

// The landing page editor, under admin/ like the other admin pages. Changes are drafts until published.
// The public page itself is served from the home URL (see App\Http\Controllers\HomeController).
Route::middleware(['web', 'auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::middleware('can:landing.manage')->group(function () {
            Route::get('landing', [AdminLandingController::class, 'index'])->name('landing.index');
            Route::put('landing/draft', [AdminLandingController::class, 'saveDraft'])->name('landing.draft.update');
            Route::post('landing/publish', [AdminLandingController::class, 'publish'])->name('landing.publish');
            Route::post('landing/discard', [AdminLandingController::class, 'discard'])->name('landing.discard');
            Route::get('landing/preview', [AdminLandingController::class, 'preview'])->name('landing.preview');
            Route::post('landing/images', [AdminLandingController::class, 'storeImage'])->name('landing.images.store');
        });
    });
