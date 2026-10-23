<?php

use App\Http\Controllers\CheckInController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\TreatmentPlanController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => auth()->check()
    ? redirect()->route('dashboard')
    : redirect()->route('login'))->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::resource('patients', PatientController::class)->except(['create', 'edit']);
    Route::resource('plans', TreatmentPlanController::class)->except(['create', 'edit', 'show'])->parameters(['plans' => 'plan']);
    Route::patch('/plans/{plan}/goals', [TreatmentPlanController::class, 'updateGoals'])->name('plans.goals.update');
    Route::resource('sessions', SessionController::class)->except(['create', 'edit', 'show'])->parameters(['sessions' => 'session']);
    Route::patch('/sessions/{session}/complete', [SessionController::class, 'complete'])->name('sessions.complete');
    Route::resource('check-ins', CheckInController::class)->except(['create', 'edit', 'show'])->parameters(['check-ins' => 'checkIn']);
});

require __DIR__.'/settings.php';
