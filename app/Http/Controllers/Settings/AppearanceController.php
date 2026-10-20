<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AppearanceUpdateRequest;
use App\Support\Fonts;
use App\Support\SidebarVariant;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AppearanceController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/appearance', [
            'sidebarVariant' => SidebarVariant::forUser($request->user()),
            'font' => Fonts::forUser($request->user()),
        ]);
    }

    public function update(AppearanceUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'sidebar_variant' => $request->validated('sidebar_variant'),
            'font' => $request->validated('font'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Appearance settings updated.')]);

        return to_route('appearance.edit');
    }
}
