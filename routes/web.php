<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ImpersonationController;
use App\Http\Controllers\Settings\LanguageController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Support\Rbac;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [HomeController::class, 'show'])->name('home');

// Language for guests, kept in the session. Signed-in users change it in their settings.
Route::post('language', [LanguageController::class, 'guest'])->middleware('web')->name('language.guest');

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
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::inertia('profile', 'user-profile')->name('user-profile.show');
    Route::get('tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::put('tasks/order', [TaskController::class, 'reorder'])->name('tasks.reorder');
    Route::patch('tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::get('users', [UserController::class, 'index'])->middleware('can:users.view')->name('users.index');
    // Role changes need the same permission the controller checks, so the route and the controller agree.
    Route::patch('users/{user}/role', [UserController::class, 'updateRole'])->middleware('can:'.Rbac::PERMISSION_USERS_MANAGE_ROLES)->name('users.role.update');
    Route::patch('users/roles', [UserController::class, 'bulkUpdateRole'])->middleware('can:'.Rbac::PERMISSION_USERS_MANAGE_ROLES)->name('users.role.bulk');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('roles', RoleController::class)
            ->except('show')
            ->middleware('can:roles.manage');

        // Read-only: permissions are defined in code (App\Support\Rbac), not created in the UI.
        Route::get('permissions', [PermissionController::class, 'index'])
            ->middleware('can:permissions.manage')
            ->name('permissions.index');

        // Admin user management. Each action checks users.manage; impersonation and the
        // audit log have their own permissions.
        Route::middleware('can:users.manage')->group(function () {
            Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
            Route::get('users/export', [UserManagementController::class, 'export'])->name('users.export');
            Route::patch('users/{user}', [UserManagementController::class, 'update'])->name('users.update');
            Route::post('users/{user}/verify-email', [UserManagementController::class, 'verifyEmail'])->name('users.verify-email');
            Route::post('users/{user}/password-reset', [UserManagementController::class, 'sendPasswordReset'])->name('users.password-reset');
            Route::post('users/{user}/suspend', [UserManagementController::class, 'suspend'])->name('users.suspend');
            Route::post('users/{user}/reinstate', [UserManagementController::class, 'reinstate'])->name('users.reinstate');
            Route::delete('users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
        });

        Route::post('users/{user}/impersonate', [ImpersonationController::class, 'start'])
            ->middleware('can:users.impersonate')
            ->name('users.impersonate');

        Route::get('audit-log', [AuditLogController::class, 'index'])
            ->middleware('can:audit.view')
            ->name('audit-log.index');
    });
});

// Stopping impersonation must work while signed in as the impersonated user, who may not be verified.
Route::middleware('auth')->post('impersonation/stop', [ImpersonationController::class, 'stop'])->name('impersonation.stop');

require __DIR__.'/settings.php';
