<?php

use App\Features\Blog\Http\Controllers\Public\BlogController;
use App\Support\Sites\PublicRoutes;
use Illuminate\Support\Facades\Route;

// The public blog. Posts are entries of the built-in post type. Comments are handled by the cms feature.
PublicRoutes::register(function () {
    Route::get('blog', [BlogController::class, 'index'])->name('blog.index');
    Route::get('blog/feed.xml', [BlogController::class, 'feed'])->name('blog.feed');
    Route::get('blog/authors/{author}', [BlogController::class, 'author'])
        ->where('author', '[0-9]+')
        ->name('blog.author');
    Route::get('blog/{slug}', [BlogController::class, 'show'])
        ->where('slug', PublicRoutes::SLUG_PATTERN)
        ->name('blog.show');
});
