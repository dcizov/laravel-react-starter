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
        'user-profile',
        'users',
        'admin-roles',
        'admin-permissions',
        'admin-users',
        'audit-log',
        'admin-landing',
        'admin-newsletter',
        'admin-integrations',
        'admin-content-pages',
        'admin-content-posts',
        'admin-cms-types',
        'admin-cms-ctas',
        'admin-cms-terms',
        'admin-blog-comments',
        'admin-seo',
        'tasks',
        'settings',
        'repository',
        'documentation',
    ];

    /**
     * The items to show: every item except the ones the user has hidden.
     * Items added after the user saved their choice are shown by default.
     *
     * @return list<string>
     */
    public static function forUser(?User $user): array
    {
        $hidden = array_intersect(self::ITEMS, $user === null ? [] : ($user->hidden_display_items ?? []));
        $visible = array_values(array_diff(self::ITEMS, $hidden));

        return $visible === [] ? self::ITEMS : $visible;
    }

    /**
     * Convert the items the user chose to show into the items to store as hidden.
     * An empty choice is not stored as hidden, so every item stays visible.
     *
     * @param  list<string>  $visible
     * @return list<string>
     */
    public static function hiddenFor(array $visible): array
    {
        $visible = array_values(array_unique($visible));

        if ($visible === []) {
            return [];
        }

        return array_values(array_diff(self::ITEMS, $visible));
    }
}
