<?php

use App\Features\Blog\Http\Controllers\Admin\CommentController;
use App\Features\Blog\Http\Controllers\Public\BlogController;
use Illuminate\Support\Facades\Route;

// Comment moderation, under admin/ like the other admin pages.
Route::middleware(['web', 'auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::middleware('can:blog.manage')->group(function () {
            Route::get('blog/comments', [CommentController::class, 'index'])->name('blog.comments.index');
            Route::patch('blog/comments/{comment}', [CommentController::class, 'update'])->name('blog.comments.update');
            Route::delete('blog/comments/{comment}', [CommentController::class, 'destroy'])->name('blog.comments.destroy');
        });
    });

// The public blog. Comments are rate limited to five a minute per visitor.
Route::middleware('web')->group(function () {
    Route::get('blog', [BlogController::class, 'index'])->name('blog.index');
    Route::get('blog/{slug}', [BlogController::class, 'show'])
        ->where('slug', '[a-z0-9]+(?:-[a-z0-9]+)*')
        ->name('blog.show');
    Route::post('blog/{slug}/comments', [BlogController::class, 'comment'])
        ->where('slug', '[a-z0-9]+(?:-[a-z0-9]+)*')
        ->middleware('throttle:5,1')
        ->name('blog.comments.store');
});
