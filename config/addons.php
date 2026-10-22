<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Addon folders
    |--------------------------------------------------------------------------
    |
    | Each addon is a folder directly inside one of these paths. Its folder name must equal its slug, and
    | it must contain an addon.json file. Only local folders are supported for now.
    |
    */

    'paths' => [
        base_path('addons'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Core version
    |--------------------------------------------------------------------------
    |
    | The version of the addon framework this application provides. An addon's "core" constraint must
    | include it, or the addon is refused.
    |
    */

    'core_version' => '1.0.0',

    /*
    |--------------------------------------------------------------------------
    | Compiled manifest
    |--------------------------------------------------------------------------
    |
    | The file the app reads at boot to learn which addons are installed and enabled. It is written by
    | php artisan addons:compile and must not be edited by hand. The last-good copy is the manifest as it
    | was before the most recent lifecycle operation, and it is restored if that operation fails.
    |
    */

    'manifest_path' => base_path('bootstrap/cache/addons.php'),

    'last_good_path' => base_path('bootstrap/cache/addons.last-good.php'),

    /*
    |--------------------------------------------------------------------------
    | Reserved slugs
    |--------------------------------------------------------------------------
    |
    | Slugs no addon may use. The names of the built-in features are reserved automatically.
    |
    */

    'reserved_slugs' => [
        'addons',
        'admin',
        'api',
        'audit-log',
        'auth',
        'comments',
        'confirm-password',
        'content',
        'dashboard',
        'email',
        'errors',
        'forgot-password',
        'impersonate',
        'language',
        'login',
        'logout',
        'permissions',
        'register',
        'reset-password',
        'roles',
        'settings',
        'sites',
        'storage',
        'tasks',
        'two-factor-challenge',
        'up',
        'user-profile',
        'users',
        'verify-email',
    ],

];
