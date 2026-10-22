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

## Build and permissions

- The frontend build leaves out the pages of disabled features. The page lists are in `vite.config.ts` (`FEATURE_PAGES`).
  Keep them in step with the feature folders, and run `npm run build` (or restart `npm run dev`) after changing `FEATURES`.
- Permissions come from each feature's `permissions()`. The roles and permissions screens only show the permissions of enabled
  features. `feature:enable` and `feature:disable` run `feature:sync-permissions`, which gives the admin role exactly the
  enabled features' permissions. Other roles are not changed.
- Setting `FEATURES` to an unknown name, or enabling a feature without its dependency, stops the application with a clear message.

## Demo content

The cms, blog, seo, and landing features come with example content, so there is something to look at after set-up.
Each feature has a seeder that only adds its own content, and each one can be run on its own. Run them once the
feature is enabled:

```
php artisan db:seed --class="App\Features\Cms\Seeders\CmsDemoSeeder"       # pages, calls to action, events, custom fields, comments
php artisan db:seed --class="App\Features\Blog\Seeders\BlogDemoSeeder"     # posts, categories, tags, comments
php artisan db:seed --class="App\Features\Seo\Seeders\SeoDemoSeeder"       # site description
php artisan db:seed --class="App\Features\Landing\Seeders\LandingDemoSeeder" # latest-posts block (fresh installs only)
```

They can run again without duplicating anything. `php artisan db:seed` on its own also runs the users and tasks
seeders, which add new rows each time, so use `--class` for the feature seeders on a database that already has data.

Factories make random content for tests and `php artisan tinker`, for example
`App\Features\Cms\Models\ContentEntry::factory()->post()->count(10)->create()`, or `->draft()`, `->scheduled()`,
`Term::factory()->tag()`, `Cta::factory()`, `Comment::factory()->approved()`.
