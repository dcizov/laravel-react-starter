<?php

namespace App\Support;

use App\Models\User;

final class NotificationSettings
{
    /**
     * Defaults used until the user saves their own choices.
     *
     * @var array<string, string|bool>
     */
    public const DEFAULTS = [
        'type' => 'all',
        'mobile' => false,
        'communication_emails' => false,
        'social_emails' => false,
        'marketing_emails' => false,
        'security_emails' => true,
    ];

    /**
     * The user's settings merged over the defaults.
     *
     * @return array<string, string|bool>
     */
    public static function forUser(User $user): array
    {
        return array_merge(self::DEFAULTS, $user->notification_settings ?? []);
    }

    /**
     * Whether the user wants emails for the given channel (e.g. "security_emails").
     */
    public static function wantsEmail(User $user, string $key): bool
    {
        return (bool) self::forUser($user)[$key];
    }
}
