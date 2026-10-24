<?php

use App\Addons\Demo\Models\DemoNote;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['web', 'auth'])->prefix('admin')->group(function (): void {
    Route::get('demo', fn () => Inertia::render('demo', [
        'notes' => DemoNote::query()->latest('id')->limit(10)->get(['id', 'body', 'created_at']),
    ]))->name('demo.index');
});
