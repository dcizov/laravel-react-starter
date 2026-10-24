<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\GeneralSettingsUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GeneralController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/general', [
            'timezone' => $request->user()->timezone,
            'locale' => $request->user()->locale,
        ]);
    }

    public function update(GeneralSettingsUpdateRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('General settings updated.')]);

        return to_route('general.edit');
    }
}
