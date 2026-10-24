<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

/**
 * In-app notifications. A user may only ever touch their own rows, so the
 * lookup is scoped through the relation rather than by id alone.
 */
class NotificationController extends Controller
{
    public function read(Request $request, string $notification): RedirectResponse
    {
        $row = $this->find($request, $notification);

        $row?->markAsRead();

        return back();
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()?->unreadNotifications()->update(['read_at' => now()]);

        return back()->with('toast', ['type' => 'success', 'message' => 'All notifications read.']);
    }

    private function find(Request $request, string $id): ?DatabaseNotification
    {
        /** @var DatabaseNotification|null $row */
        $row = $request->user()?->notifications()->whereKey($id)->first();

        return $row;
    }
}
