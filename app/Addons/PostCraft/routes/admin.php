<?php

declare(strict_types=1);

use App\Addons\PostCraft\Http\Controllers\Admin\PostController;
use App\Addons\PostCraft\Http\Controllers\Admin\TaxonomyController;
use App\Cms\Addons\Middleware\EnsureAddonActive;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'verified', 'active', EnsureAddonActive::class.':PostCraft'])
    ->prefix('admin')
    ->group(function (): void {
        Route::get('posts', [PostController::class, 'index'])->name('postcraft.admin.posts.index');
        Route::get('posts/create', [PostController::class, 'create'])->name('postcraft.admin.posts.create');
        Route::post('posts', [PostController::class, 'store'])->name('postcraft.admin.posts.store');
        Route::get('posts/{post}/edit', [PostController::class, 'edit'])->name('postcraft.admin.posts.edit');
        Route::patch('posts/{post}', [PostController::class, 'update'])->name('postcraft.admin.posts.update');
        Route::post('posts/{post}/publish', [PostController::class, 'publish'])->name('postcraft.admin.posts.publish');
        Route::post('posts/{post}/unpublish', [PostController::class, 'unpublish'])->name('postcraft.admin.posts.unpublish');
        Route::delete('posts/{post}', [PostController::class, 'destroy'])->name('postcraft.admin.posts.destroy');

        Route::get('posts/taxonomy', [TaxonomyController::class, 'index'])->name('postcraft.admin.taxonomy.index');
        Route::post('categories', [TaxonomyController::class, 'storeCategory'])->name('postcraft.admin.categories.store');
        Route::patch('categories/{category}', [TaxonomyController::class, 'updateCategory'])->name('postcraft.admin.categories.update');
        Route::delete('categories/{category}', [TaxonomyController::class, 'destroyCategory'])->name('postcraft.admin.categories.destroy');
        Route::post('tags', [TaxonomyController::class, 'storeTag'])->name('postcraft.admin.tags.store');
        Route::patch('tags/{tag}', [TaxonomyController::class, 'updateTag'])->name('postcraft.admin.tags.update');
        Route::delete('tags/{tag}', [TaxonomyController::class, 'destroyTag'])->name('postcraft.admin.tags.destroy');
    });
