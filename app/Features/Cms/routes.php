<?php

use App\Features\Cms\Http\Controllers\Admin\CommentController;
use App\Features\Cms\Http\Controllers\Admin\ContentEntryController;
use App\Features\Cms\Http\Controllers\Admin\ContentTypeController;
use App\Features\Cms\Http\Controllers\Admin\CtaController;
use App\Features\Cms\Http\Controllers\Admin\TermController;
use App\Features\Cms\Http\Controllers\Public\ContentController;
use App\Support\Rbac;
use App\Support\Sites\PublicRoutes;
use Illuminate\Support\Facades\Route;

// The admin pages for content. Each group checks the permission it needs. Entry-level checks (own entries, publishing,
// trash) are in App\Features\Cms\Policies\ContentEntryPolicy and checked in the controller.
Route::middleware(['web', 'auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Content types are the site's structure, so only the admin changes them.
        Route::middleware('can:settings.manage')->group(function () {
            Route::get('cms/types', [ContentTypeController::class, 'index'])->name('cms.types.index');
            Route::post('cms/types', [ContentTypeController::class, 'store'])->name('cms.types.store');
            Route::put('cms/types/{contentType}', [ContentTypeController::class, 'update'])->name('cms.types.update');
            Route::delete('cms/types/{contentType}', [ContentTypeController::class, 'destroy'])->name('cms.types.destroy');
        });

        Route::middleware('can:'.Rbac::PERMISSION_CONTENT_EDIT_ANY)->group(function () {
            Route::get('cms/ctas', [CtaController::class, 'index'])->name('cms.ctas.index');
            Route::post('cms/ctas', [CtaController::class, 'store'])->name('cms.ctas.store');
            Route::put('cms/ctas/{cta}', [CtaController::class, 'update'])->name('cms.ctas.update');
            Route::delete('cms/ctas/{cta}', [CtaController::class, 'destroy'])->name('cms.ctas.destroy');

            Route::get('cms/terms', [TermController::class, 'index'])->name('cms.terms.index');
            Route::post('cms/terms', [TermController::class, 'store'])->name('cms.terms.store');
            Route::put('cms/terms/{term}', [TermController::class, 'update'])->name('cms.terms.update');
            Route::delete('cms/terms/{term}', [TermController::class, 'destroy'])->name('cms.terms.destroy');
        });

        Route::post('cms/images', [ContentEntryController::class, 'storeImage'])
            ->middleware('can:'.Rbac::PERMISSION_CONTENT_CREATE)
            ->name('cms.images.store');

        // Comment moderation. The path is kept from the blog feature, where it first lived.
        Route::middleware('can:'.Rbac::PERMISSION_COMMENTS_MODERATE)->group(function () {
            Route::get('blog/comments', [CommentController::class, 'index'])->name('blog.comments.index');
            Route::post('blog/comments/bulk', [CommentController::class, 'bulk'])->name('blog.comments.bulk');
            Route::patch('blog/comments/{comment}', [CommentController::class, 'update'])->name('blog.comments.update');
            Route::delete('blog/comments/{comment}', [CommentController::class, 'destroy'])->name('blog.comments.destroy');
        });

        Route::middleware('can:'.Rbac::PERMISSION_CONTENT_VIEW)->group(function () {
            Route::get('content/{type}', [ContentEntryController::class, 'index'])->name('content.index');
            Route::post('content/{type}/bulk', [ContentEntryController::class, 'bulk'])->name('content.bulk');
            Route::post('content/{type}/preview', [ContentEntryController::class, 'preview'])->name('content.preview.store');
            Route::get('content/{type}/preview/{token}', [ContentEntryController::class, 'showPreview'])
                ->where('token', '[A-Za-z0-9]{40}')
                ->name('content.preview.show');
            Route::get('content/{type}/{entry}/edit', [ContentEntryController::class, 'edit'])
                ->withTrashed()
                ->name('content.edit');
        });

        Route::middleware('can:'.Rbac::PERMISSION_CONTENT_CREATE)->group(function () {
            Route::get('content/{type}/create', [ContentEntryController::class, 'create'])->name('content.create');
            Route::post('content/{type}', [ContentEntryController::class, 'store'])->name('content.store');
        });

        Route::put('content/{type}/{entry}', [ContentEntryController::class, 'update'])
            ->withTrashed()
            ->name('content.update');
        Route::delete('content/{type}/{entry}', [ContentEntryController::class, 'destroy'])
            ->name('content.destroy');
        Route::post('content/{type}/{entry}/restore', [ContentEntryController::class, 'restore'])
            ->withTrashed()
            ->name('content.restore');
        Route::delete('content/{type}/{entry}/permanently', [ContentEntryController::class, 'forceDestroy'])
            ->withTrashed()
            ->name('content.force-destroy');
        Route::post('content/{type}/{entry}/revisions/{revision}/restore', [ContentEntryController::class, 'restoreRevision'])
            ->withTrashed()
            ->name('content.revisions.restore');
    });

// The public site. Pages are at /pages/{slug}, custom types at /content/{type} and /content/{type}/{slug}.
PublicRoutes::register(function () {
    Route::get('pages/{slug}', [ContentController::class, 'page'])
        ->where('slug', PublicRoutes::SLUG_PATTERN)
        ->name('pages.show');
    Route::get('content/{type}', [ContentController::class, 'archive'])
        ->where('type', '[a-z][a-z0-9-]{1,39}')
        ->name('content.archive');
    Route::get('content/{type}/{slug}', [ContentController::class, 'show'])
        ->where(['type' => '[a-z][a-z0-9-]{1,39}', 'slug' => PublicRoutes::SLUG_PATTERN])
        ->name('content.show');

    // Visitors' comments on any type with the comments support. Five a minute per visitor.
    Route::post('content/{type}/{slug}/comments', [ContentController::class, 'comment'])
        ->where(['type' => '[a-z][a-z0-9-]{1,39}', 'slug' => PublicRoutes::SLUG_PATTERN])
        ->middleware('throttle:5,1')
        ->name('content.comments.store');
});
