<?php

namespace App\Support;

use App\Models\User;

final class Fonts
{
    /**
     * Font families the user can choose. The keys match the data-font values in the frontend.
     *
     * @var list<string>
     */
    public const KEYS = ['instrument-sans', 'inter', 'manrope', 'system'];

    public const DEFAULT = 'instrument-sans';

    /**
     * The user's saved font, or the default when none is valid.
     */
    public static function forUser(?User $user): string
    {
        $saved = $user?->font;

        return in_array($saved, self::KEYS, true) ? $saved : self::DEFAULT;
    }
}
