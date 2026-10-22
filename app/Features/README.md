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

## Sites

One installation can publish several sites. The default site answers every address that no other site claims, and keeps
the unprefixed URLs (`/blog`, `/pages/kontakt`). Each other site is reached in one of two ways:

- **By domain**: set the site's `domain`, such as `news.example.com`. Its links use that host.
- **By path**: leave `domain` empty. The site lives under `/s/{slug}`, and every link on it carries the prefix.

`App\Http\Middleware\ResolveSite` picks the site for each request and stores it in `App\Support\Sites\CurrentSite`.
Entries, categories and tags, and calls to action belong to a site (`BelongsToSite`), and queries only see the current
site. Content types are shared by all sites.

Rules for public code, so that path mode keeps working:

- Routes for public pages are registered with `App\Support\Sites\PublicRoutes::register()`, which registers each route
  twice: at the root and under `/s/{site}`. Both copies share one name, and Laravel keeps the first registration, so the
  root copy is registered first. Use `route('blog.index')` and similar names as usual.
- In the browser, build links to public pages with the site's base path (`useSiteBase()` in
  `resources/js/hooks/use-site-base.ts`), never with a hard-coded `/blog`. The newsletter pages are global and keep their URLs.
- The `{site}` segment is removed from the route parameters once it has been read, so a controller's `$slug` is still the
  first parameter after it. Laravel passes parameters by position.
- Seeders run with model events muted (`DatabaseSeeder` uses `WithoutModelEvents`), so the site-filling hook of
  `BelongsToSite` does not run. A seeder must give `site_id` itself.

The site's name, locale, description (the SEO default) and home page (`home_slug`) are set in the admin under Sites.

## Blog

The blog is the built-in `post` type, with the feature `blog` switched on:

- `/blog` lists the posts, with a search box (title and excerpt, GET `?q=`), categories and tags.
  The search and filters keep their values when you paginate, and can be bookmarked.
- `/blog/feed.xml` is the RSS feed for the site.
- `/blog/authors/{id}` lists one author's live posts. Post pages and lists link to it. Authors with no live posts have no page.

## Demo content

The cms, blog, seo, and landing features come with example content, so there is something to look at after set-up.
Each feature has a seeder that only adds its own content, and each one can be run on its own. Run them once the
feature is enabled:

```
php artisan db:seed --class="App\Features\Cms\Seeders\CmsDemoSeeder"       # pages, calls to action, events, custom fields, comments
php artisan db:seed --class="Database\Seeders\SitesDemoSeeder"          # a second site, Newsroom, in German, at /s/newsroom (needs cms)
php artisan db:seed --class="App\Features\Blog\Seeders\BlogDemoSeeder"     # posts, categories, tags, comments
php artisan db:seed --class="App\Features\Seo\Seeders\SeoDemoSeeder"       # site description
php artisan db:seed --class="App\Features\Landing\Seeders\LandingDemoSeeder" # latest-posts block (fresh installs only)
```

They can run again without duplicating anything. `php artisan db:seed` on its own also runs the users and tasks
seeders, which add new rows each time, so use `--class` for the feature seeders on a database that already has data.

Factories make random content for tests and `php artisan tinker`, for example
`App\Features\Cms\Models\ContentEntry::factory()->post()->count(10)->create()`, or `->draft()`, `->scheduled()`,
`Term::factory()->tag()`, `Cta::factory()`, `Comment::factory()->approved()`.
