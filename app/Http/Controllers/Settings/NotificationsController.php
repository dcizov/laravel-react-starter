<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\NotificationsSettingsUpdateRequest;
use App\Support\NotificationSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/notifications', [
            'settings' => NotificationSettings::forUser($request->user()),
        ]);
    }

    public function update(NotificationsSettingsUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'notification_settings' => $request->validated(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Notification settings updated.')]);

        return to_route('notifications.edit');
    }
}
