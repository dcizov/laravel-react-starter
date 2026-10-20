<?php

namespace App\Support;

final class DisplaySettings
{
    /**
     * Sidebar items the user can show or hide.
     *
     * @var list<string>
     */
    public const ITEMS = [
        'recents',
        'home',
        'applications',
        'desktop',
        'downloads',
        'documents',
    ];

    /**
     * Items shown when the user has not chosen their own.
     *
     * @var list<string>
     */
    public const DEFAULT_ITEMS = ['recents', 'home', 'applications', 'desktop', 'downloads', 'documents'];
}
