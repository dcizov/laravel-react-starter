<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\DisplaySettingsUpdateRequest;
use App\Support\DisplaySettings;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DisplayController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/display', [
            'items' => $request->user()->display_items ?? DisplaySettings::DEFAULT_ITEMS,
        ]);
    }

    public function update(DisplaySettingsUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'display_items' => array_values(array_unique($request->validated('items'))),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Display settings updated.')]);

        return to_route('display.edit');
    }
}
