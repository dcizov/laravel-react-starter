<?php

namespace App\Support;

final class Timezones
{
    /**
     * Timezones a user can choose from.
     *
     * @var list<string>
     */
    public const ZONES = [
        'UTC',
        'Europe/Berlin',
        'Europe/Vienna',
        'Europe/Zurich',
        'Europe/London',
        'Europe/Paris',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Sao_Paulo',
        'Africa/Johannesburg',
        'Asia/Dubai',
        'Asia/Kolkata',
        'Asia/Singapore',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Pacific/Auckland',
    ];

    /**
     * Timezone used when a user has not chosen one, based on their language.
     *
     * @var array<string, string>
     */
    private const DEFAULTS = [
        'en' => 'UTC',
        'de' => 'Europe/Berlin',
    ];

    public static function defaultFor(string $locale): string
    {
        return self::DEFAULTS[$locale] ?? 'UTC';
    }
}
