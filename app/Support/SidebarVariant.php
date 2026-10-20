<?php

namespace App\Support;

use App\Models\User;

final class SidebarVariant
{
    /**
     * Sidebar layouts the user can choose from.
     * "inset" sits beside the content; "floating" hovers above the page with a border.
     *
     * @var list<string>
     */
    public const VARIANTS = ['inset', 'floating'];

    public const DEFAULT = 'inset';

    /**
     * The user's saved layout, or the default when none is valid.
     */
    public static function forUser(?User $user): string
    {
        $saved = $user?->sidebar_variant;

        return in_array($saved, self::VARIANTS, true) ? $saved : self::DEFAULT;
    }
}
