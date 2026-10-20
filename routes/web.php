<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

// Local only: preview the error pages at /errors/404 and so on. Production uses them through bootstrap/app.php.
if (app()->environment('local')) {
    Route::get('errors/{code}', function (string $code) {
        $pages = [
            '401' => 'errors/unauthorized-error',
            '403' => 'errors/forbidden',
            '404' => 'errors/not-found-error',
            '500' => 'errors/general-error',
            '503' => 'errors/maintenance-error',
        ];

        abort_unless(isset($pages[$code]), 404);

        return Inertia::render($pages[$code]);
    })->whereIn('code', ['401', '403', '404', '500', '503']);
}

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

        // Read-only: permissions are defined in code (App\Support\Rbac), not created in the UI.
        Route::get('permissions', [PermissionController::class, 'index'])
            ->middleware('can:permissions.manage')
            ->name('permissions.index');
    });
});

require __DIR__.'/settings.php';
