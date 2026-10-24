<?php

use App\Addons\PostCraft\Http\Controllers\BlogController;
use App\Cms\Addons\Middleware\EnsureAddonActive;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', EnsureAddonActive::class.':PostCraft'])->group(function (): void {
    // The feed is registered before the slug route so /blog/rss.xml is never
    // mistaken for a post called "rss".
    Route::get('blog/rss.xml', [BlogController::class, 'feed'])->name('postcraft.blog.feed');
    Route::get('blog', [BlogController::class, 'index'])->name('postcraft.blog.index');
    Route::get('blog/{slug}', [BlogController::class, 'show'])
        ->where('slug', '[a-z0-9][a-z0-9\-]*')
        ->name('postcraft.blog.show');
});
