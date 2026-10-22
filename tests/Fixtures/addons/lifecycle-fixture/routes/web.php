<?php

use Fixtures\LifecycleFixture\Http\Controllers\PingController;
use Illuminate\Support\Facades\Route;

// Loaded under /addons/lifecycle-fixture with the name prefix addons.lifecycle-fixture.
Route::get('ping', [PingController::class, 'show'])->name('ping');
