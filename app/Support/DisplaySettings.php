<?php

namespace App\Support;

use App\Models\User;

final class DisplaySettings
{
    /**
     * Sidebar items the user can show or hide.
     *
     * @var list<string>
     */
    public const ITEMS = [
        'dashboard',
        'profile',
        'account',
        'appearance',
        'notifications',
        'repository',
        'documentation',
    ];

    /**
     * The items the user has chosen, or all items when they have not chosen.
     * Saved values that are no longer valid are ignored.
     *
     * @return list<string>
     */
    public static function forUser(?User $user): array
    {
        $saved = array_values(array_intersect(self::ITEMS, $user?->display_items ?? []));

        return $saved === [] ? self::ITEMS : $saved;
    }
}
