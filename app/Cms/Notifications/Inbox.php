<?php

declare(strict_types=1);

namespace App\Cms\Notifications;

use App\Models\User;

/**
 * The bell's payload. Kept out of the Inertia middleware so it can be built
 * (and tested) without an HTTP request, and so the deferred prop stays a
 * one-line closure.
 */
final class Inbox
{
    /**
     * @return array{items: list<array<string, mixed>>, unread: int, read_all_url: string}
     */
    public function for(User $user): array
    {
        $rows = $user->notifications()->latest()->limit(10)->get();

        return [
            'items' => $rows->map(fn ($row): array => [
                'id' => $row->id,
                'title' => (string) ($row->data['title'] ?? 'Notification'),
                'body' => (string) ($row->data['body'] ?? ''),
                'url' => $row->data['url'] ?? null,
                'level' => (string) ($row->data['level'] ?? 'info'),
                'read' => $row->read_at !== null,
                'created_at' => $row->created_at?->toIso8601String(),
                'read_url' => route('admin.notifications.read', ['notification' => $row->id]),
            ])->all(),
            'unread' => $user->unreadNotifications()->count(),
            'read_all_url' => route('admin.notifications.read-all'),
        ];
    }
}
