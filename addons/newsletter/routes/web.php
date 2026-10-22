<?php

use Addons\Newsletter\Http\Controllers\Admin\SubscriberController;
use Addons\Newsletter\Http\Controllers\SubscribeController;
use Illuminate\Support\Facades\Route;

// Public pages. The sign-up form is throttled to slow down scripted sign-ups.
Route::middleware('web')->group(function () {
    Route::get('newsletter', [SubscribeController::class, 'create'])->name('newsletter.create');
    Route::post('newsletter', [SubscribeController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('newsletter.store');
    Route::get('newsletter/unsubscribe/{token}', [SubscribeController::class, 'unsubscribe'])->name('newsletter.unsubscribe');
});

// Admin pages, under admin/ like the other admin pages.
Route::middleware(['web', 'auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::middleware('can:newsletter.manage')->group(function () {
            Route::get('newsletter', [SubscriberController::class, 'index'])->name('newsletter.index');
            Route::get('newsletter/export', [SubscriberController::class, 'exportCsv'])->name('newsletter.csv');
            Route::post('newsletter/bulk-delete', [SubscriberController::class, 'bulkDestroy'])->name('newsletter.bulk-destroy');
            Route::delete('newsletter/{subscriber}', [SubscriberController::class, 'destroy'])->name('newsletter.destroy');
        });
    });
