# Features

A feature is a self-contained part of the starter kit: the landing page, the newsletter, integrations.
Each one lives in its own folder here and is switched on or off at set-up time.

## Switching features

The features in use are listed in `FEATURES` in `.env` (read by `config/features.php`):

```
FEATURES=landing,newsletter,integrations
```

```
php artisan feature:list
php artisan feature:enable newsletter     # adds it to FEATURES and runs its migrations
php artisan feature:disable newsletter    # removes it from FEATURES; its tables and data are kept
```

After enabling or disabling, run `php artisan config:clear` if the config is cached, and `npm run build`
so the frontend pages are included or removed.

## What a feature contains

- `XxxFeature.php`: the slug, label, providers and dependencies.
- `XxxServiceProvider.php`: loads the feature's routes and migrations.
- `routes.php`: its routes. Admin pages sit under `admin/`, behind the feature's permission.
- `database/migrations/`: its tables, plus a grant migration for its permission (see `grant_landing_permission`).
- Controllers, models and support classes.

Register a new feature by adding its class to `available` in `config/features.php`.

## Known limits

- The React code of disabled features stays in the JavaScript bundle. Only routes and menu entries are switched off.
- Permissions are still listed in `App\Support\Rbac::PERMISSIONS`, so the roles page shows the permissions of disabled features.
- Setting `FEATURES` to an unknown name, or enabling a feature without its dependency, stops the application with a clear message.
