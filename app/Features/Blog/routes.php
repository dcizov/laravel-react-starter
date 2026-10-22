<?php

use App\Features\Blog\Http\Controllers\Public\BlogController;
use Illuminate\Support\Facades\Route;

// The public blog. Posts are entries of the built-in post type. Comments are handled by the cms feature.
Route::middleware('web')->group(function () {
    Route::get('blog', [BlogController::class, 'index'])->name('blog.index');
    Route::get('blog/{slug}', [BlogController::class, 'show'])
        ->where('slug', '[a-z0-9]+(?:-[a-z0-9]+)*')
        ->name('blog.show');
});
