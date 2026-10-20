<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('profile', 'user-profile')->name('user-profile.show');
    Route::get('tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::get('users', [UserController::class, 'index'])->middleware('can:users.view')->name('users.index');
    Route::patch('users/{user}/role', [UserController::class, 'updateRole'])->middleware('can:users.view')->name('users.role.update');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('roles', RoleController::class)
            ->except('show')
            ->middleware('can:roles.manage');

        Route::resource('permissions', PermissionController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('can:permissions.manage');
    });
});

require __DIR__.'/settings.php';
