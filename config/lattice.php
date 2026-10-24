<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Lattice version
    |--------------------------------------------------------------------------
    |
    | Compared against the `requires.lattice` constraint of every addon and
    | theme manifest before it is allowed to be activated.
    |
    */

    'version' => '0.1.0',

    /*
    |--------------------------------------------------------------------------
    | Extension paths
    |--------------------------------------------------------------------------
    |
    | Addons and themes are folders on disk. They are never registered by
    | Composer — the database decides which ones boot.
    |
    */

    'paths' => [
        'addons' => app_path('Addons'),
        'themes' => app_path('Themes'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | Only handles and scalars are cached. Models are re-queried on every
    | request because a serialising cache store cannot round-trip them.
    |
    */

    'cache' => [
        'store' => env('LATTICE_CACHE_STORE'),
        'ttl' => env('LATTICE_CACHE_TTL', 3600),
        'keys' => [
            'addons' => 'lattice.addons.active',
            'themes' => 'lattice.theme.active',
            'navigation' => 'lattice.navigation',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Roles and permissions
    |--------------------------------------------------------------------------
    |
    | The role matrix is data, not code: the seeder turns it into Spatie roles
    | and permissions, and every policy/gate reads the same names. Permissions
    | from installed addon manifests are registered too, so an addon never has
    | to edit this file.
    |
    | `Admin` receives every permission that exists (`*`), including the ones
    | declared by addons and the admin-only abilities below.
    |
    */

    'admin_only_abilities' => [
        'users.manage',
        'addons.manage',
    ],

    'roles' => [
        'Admin' => ['*'],
        'Editor' => [
            'pages.view', 'pages.create', 'pages.update', 'pages.publish', 'pages.delete',
            'media.view', 'media.upload', 'media.update', 'media.delete',
            'settings.view', 'settings.update',
            'users.view',
            'addons.view',
            'themes.view', 'themes.activate',
            'activity.view',
        ],
        'Author' => [
            'pages.view', 'pages.create', 'pages.update',
            'media.view', 'media.upload',
            'activity.view',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Core navigation
    |--------------------------------------------------------------------------
    |
    | The same registry addons write to. Adding an admin screen means adding an
    | entry here (or in an addon.json) — never editing the React sidebar.
    |
    */

    'core_navigation' => [
        ['section' => 'Workspace', 'label' => 'Dashboard', 'route' => '/admin', 'icon' => 'layout-dashboard', 'order' => 10],
        ['section' => 'Content', 'label' => 'Pages', 'route' => '/admin/pages', 'icon' => 'file-text', 'order' => 20],
        ['section' => 'Content', 'label' => 'Media', 'route' => '/admin/media', 'icon' => 'image', 'order' => 30],
        ['section' => 'Site', 'label' => 'Appearance', 'route' => '/admin/appearance', 'icon' => 'palette', 'order' => 40],
        ['section' => 'Site', 'label' => 'Addons', 'route' => '/admin/addons', 'icon' => 'plug', 'order' => 50],
        ['section' => 'Team', 'label' => 'Users', 'route' => '/admin/users', 'icon' => 'users', 'order' => 60],
        ['section' => 'Team', 'label' => 'Activity', 'route' => '/admin/activity', 'icon' => 'activity', 'order' => 70],
        ['section' => 'System', 'label' => 'Settings', 'route' => '/admin/settings', 'icon' => 'settings', 'order' => 80],
    ],

    /*
    |--------------------------------------------------------------------------
    | Site identity
    |--------------------------------------------------------------------------
    |
    | Public chrome reads these until the settings screen (S7) makes them
    | editable. The name shows in the header and in the sitemap.
    |
    */

    'site' => [
        'name' => env('LATTICE_SITE_NAME', 'Northwind Studio'),
        'tagline' => env('LATTICE_SITE_TAGLINE', 'Design for things that last'),
        'description' => env('LATTICE_SITE_DESCRIPTION', 'A design studio working on identity, product and print.'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Generated TypeScript
    |--------------------------------------------------------------------------
    |
    | `lattice:discover` writes the page and section registries that the
    | frontend imports. JS is resolved at build time, never at runtime.
    |
    */

    'generated_path' => resource_path('js/lib/generated'),

];
