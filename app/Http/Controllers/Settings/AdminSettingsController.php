<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Settings\AppSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
                'custom_error_pages' => $settings->custom_error_pages,
                'logo_url' => $settings->app_logo_path
                    ? Storage::disk('public')->url($settings->app_logo_path)
                    : null,
            ],
            'roles' => Role::query()->orderBy('name')->pluck('name')->values(),
        ]);
    }

    public function update(Request $request, AppSettings $settings): RedirectResponse
    {
        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:100'],
            'default_role' => ['required', 'string', Rule::exists('roles', 'name')],
            // PNG, JPEG, and WebP only. SVG is left out: an uploaded SVG can carry scripts when served from this site.
            'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'remove_logo' => ['boolean'],
            // Switches come from a multipart form, where false arrives as an empty or "0" value. Read them with
            // $request->boolean() below, so an empty value counts as off.
            'custom_error_pages' => ['nullable', 'boolean'],
        ]);

        $settings->app_name = $validated['app_name'];
        $settings->default_role = $validated['default_role'];
        $settings->custom_error_pages = $request->boolean('custom_error_pages');

        if ($request->hasFile('logo') || $request->boolean('remove_logo')) {
            if ($settings->app_logo_path) {
                Storage::disk('public')->delete($settings->app_logo_path);
            }

            $settings->app_logo_path = $request->hasFile('logo')
                ? (string) $request->file('logo')->store('branding', 'public')
                : null;
        }

        $settings->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings saved.')]);

        return to_route('admin-settings.edit');
    }
}
