<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Settings\AppSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AdminSettingsController extends Controller
{
    public function edit(AppSettings $settings): Response
    {
        return Inertia::render('settings/admin', [
            'settings' => [
                'app_name' => $settings->app_name,
                'default_role' => $settings->default_role,
            ],
            'roles' => Role::query()->orderBy('name')->pluck('name')->values(),
        ]);
    }

    public function update(Request $request, AppSettings $settings): RedirectResponse
    {
        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:100'],
            'default_role' => ['required', 'string', Rule::exists('roles', 'name')],
        ]);

        $settings->app_name = $validated['app_name'];
        $settings->default_role = $validated['default_role'];
        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings saved.')]);

        return to_route('admin-settings.edit');
    }
}
