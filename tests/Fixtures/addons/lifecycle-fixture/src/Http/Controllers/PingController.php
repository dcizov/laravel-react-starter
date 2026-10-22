<?php

namespace Fixtures\LifecycleFixture\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

/**
 * Controller classes, not closures, so the fixture's routes survive php artisan route:cache.
 */
final class PingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['addon' => 'lifecycle-fixture', 'ok' => true]);
    }
}
