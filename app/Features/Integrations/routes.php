<?php

use App\Features\Integrations\Http\Controllers\Admin\IntegrationController;
use Illuminate\Support\Facades\Route;

// Admin pages, under admin/ like the other admin pages.
Route::middleware(['web', 'auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::middleware('can:integrations.manage')->group(function () {
            Route::get('integrations', [IntegrationController::class, 'index'])->name('integrations.index');
            Route::put('integrations/{integration}', [IntegrationController::class, 'update'])->name('integrations.update');
            Route::delete('integrations/{integration}', [IntegrationController::class, 'destroy'])->name('integrations.destroy');
        });
    });
