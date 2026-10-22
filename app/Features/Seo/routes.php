<?php

use App\Features\Seo\Http\Controllers\Admin\SeoSettingsController;
use App\Features\Seo\Http\Controllers\Public\RobotsController;
use App\Features\Seo\Http\Controllers\Public\SitemapController;
use App\Support\Sites\PublicRoutes;
use Illuminate\Support\Facades\Route;

// The SEO settings page, under admin/ like the other admin pages.
Route::middleware(['web', 'auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::middleware('can:seo.manage')->group(function () {
            Route::get('seo', [SeoSettingsController::class, 'edit'])->name('seo.edit');
            Route::put('seo', [SeoSettingsController::class, 'update'])->name('seo.update');
        });
    });

// Each site has its own sitemap, and robots.txt points at the sitemap of the site that answers.
PublicRoutes::register(function () {
    Route::get('sitemap.xml', SitemapController::class)->name('seo.sitemap');
    Route::get('robots.txt', RobotsController::class)->name('seo.robots');
});
