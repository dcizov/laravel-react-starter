<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\NotificationsSettingsUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    /**
     * Defaults used until the user saves their own choices.
     *
     * @var array<string, string|bool>
     */
    private const DEFAULTS = [
        'type' => 'all',
        'mobile' => false,
        'communication_emails' => false,
        'social_emails' => false,
        'marketing_emails' => false,
        'security_emails' => true,
    ];

    public function edit(Request $request): Response
    {
        return Inertia::render('settings/notifications', [
            'settings' => array_merge(self::DEFAULTS, $request->user()->notification_settings ?? []),
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
