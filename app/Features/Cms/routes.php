<?php

use App\Features\Cms\Http\Controllers\Admin\CommentController;
use App\Features\Cms\Http\Controllers\Admin\ContentEntryController;
use App\Features\Cms\Http\Controllers\Admin\ContentTypeController;
use App\Features\Cms\Http\Controllers\Admin\CtaController;
use App\Features\Cms\Http\Controllers\Admin\TermController;
use App\Features\Cms\Http\Controllers\Public\ContentController;
use Illuminate\Support\Facades\Route;

// The admin pages for the content types, entries, calls to action and terms. All behind content.manage.
Route::middleware(['web', 'auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::middleware('can:content.manage')->group(function () {
            Route::get('cms/types', [ContentTypeController::class, 'index'])->name('cms.types.index');
            Route::post('cms/types', [ContentTypeController::class, 'store'])->name('cms.types.store');
            Route::put('cms/types/{contentType}', [ContentTypeController::class, 'update'])->name('cms.types.update');
            Route::delete('cms/types/{contentType}', [ContentTypeController::class, 'destroy'])->name('cms.types.destroy');

            Route::get('cms/ctas', [CtaController::class, 'index'])->name('cms.ctas.index');
            Route::post('cms/ctas', [CtaController::class, 'store'])->name('cms.ctas.store');
            Route::put('cms/ctas/{cta}', [CtaController::class, 'update'])->name('cms.ctas.update');
            Route::delete('cms/ctas/{cta}', [CtaController::class, 'destroy'])->name('cms.ctas.destroy');

            Route::get('cms/terms', [TermController::class, 'index'])->name('cms.terms.index');
            Route::post('cms/terms', [TermController::class, 'store'])->name('cms.terms.store');
            Route::put('cms/terms/{term}', [TermController::class, 'update'])->name('cms.terms.update');
            Route::delete('cms/terms/{term}', [TermController::class, 'destroy'])->name('cms.terms.destroy');

            Route::post('cms/images', [ContentEntryController::class, 'storeImage'])->name('cms.images.store');

            // Comment moderation. The path is kept from the blog feature, where it first lived.
            Route::get('blog/comments', [CommentController::class, 'index'])->name('blog.comments.index');
            Route::patch('blog/comments/{comment}', [CommentController::class, 'update'])->name('blog.comments.update');
            Route::delete('blog/comments/{comment}', [CommentController::class, 'destroy'])->name('blog.comments.destroy');

            Route::get('content/{type}', [ContentEntryController::class, 'index'])->name('content.index');
            Route::get('content/{type}/create', [ContentEntryController::class, 'create'])->name('content.create');
            Route::post('content/{type}', [ContentEntryController::class, 'store'])->name('content.store');
            Route::get('content/{type}/{entry}/edit', [ContentEntryController::class, 'edit'])->name('content.edit');
            Route::put('content/{type}/{entry}', [ContentEntryController::class, 'update'])->name('content.update');
            Route::delete('content/{type}/{entry}', [ContentEntryController::class, 'destroy'])->name('content.destroy');
        });
    });

// The public site. Pages are at /pages/{slug}, custom types at /content/{type} and /content/{type}/{slug}.
Route::middleware('web')->group(function () {
    Route::get('pages/{slug}', [ContentController::class, 'page'])
        ->where('slug', '[a-z0-9]+(?:-[a-z0-9]+)*')
        ->name('pages.show');
    Route::get('content/{type}', [ContentController::class, 'archive'])
        ->where('type', '[a-z][a-z0-9-]{1,39}')
        ->name('content.archive');
    Route::get('content/{type}/{slug}', [ContentController::class, 'show'])
        ->where(['type' => '[a-z][a-z0-9-]{1,39}', 'slug' => '[a-z0-9]+(?:-[a-z0-9]+)*'])
        ->name('content.show');

    // Visitors' comments on any type with the comments support. Five a minute per visitor.
    Route::post('content/{type}/{slug}/comments', [ContentController::class, 'comment'])
        ->where(['type' => '[a-z][a-z0-9-]{1,39}', 'slug' => '[a-z0-9]+(?:-[a-z0-9]+)*'])
        ->middleware('throttle:5,1')
        ->name('content.comments.store');
});
