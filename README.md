# Lattice

A self-hosted CMS that is small on purpose: pages with a section-based editor,
a media library, themes, menus, addons and a public site that never depends on a
runtime template engine.

Lattice is **invite-only** — there is no registration screen. An administrator
invites people from `/admin/users`.

## Stack

| Layer | Choice |
|---|---|
| Backend | Laravel 13, PHP 8.3+ |
| Frontend | React 19 (strict TypeScript), Inertia v3, Vite |
| Styling | Tailwind 4, shadcn/ui, lucide-react, bundled Inter |
| Database | SQLite by default (any Laravel driver works) |
| Tests | Pest, Pint |
| Extra packages | `spatie/laravel-permission`, `spatie/laravel-activitylog` |

Everything else — permissions, addons, themes, sections, navigation — is part of
`app/Cms`.

## Quickstart

```bash
git clone <repository> lattice && cd lattice

composer setup          # install, .env, key, SQLite file, Lattice, assets
composer setup:demo     # ...and the demo site
php artisan serve
```

`composer setup` is the one command that does the whole install: it copies
`.env.example` to `.env` (skipping an existing `.env`), generates the key,
creates `database/database.sqlite`, runs `lattice:install`, then installs the
npm packages and builds the assets. `composer setup:demo` adds
`--demo` to the seed.

<details>
<summary>Same steps by hand</summary>

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite

npm install && npm run build

php artisan lattice:install --demo
php artisan serve
```

</details>

`.env.example` ships with `DB_CONNECTION=sqlite` and `MAIL_MAILER=log`, so
nothing else has to run for a first boot. Coming from the plain Laravel starter
with an existing `.env`? `composer setup` keeps it — set `DB_CONNECTION=sqlite`
there (and drop the `pgsql` host lines) or start over with
`rm .env && composer setup`.

`lattice:install --demo` migrates the core, installs the addons and themes found
on disk, links storage, regenerates the frontend registries and seeds the demo
site (Northwind Studio):

- **8 pages** — Home, Services, About, Contact and Imprint published; one
  scheduled, one draft, one in the bin.
- **8 media items**, drawn with GD at seed time, with alt text.
- **PostCraft** active: 3 categories, 4 tags, 6 posts over five months, an RSS
  feed at `/blog/rss.xml`.
- **Settings** for all five groups, main and footer menus, 25 activity rows and
  eight weeks of page views for the dashboard chart.
- **`Shopper`** sits on disk and deliberately refuses to install (`lattice ^2.0`).

Then open <http://localhost:8000>.

### Demo accounts

All three use the password `password`.

| Email | Role | Can |
|---|---|---|
| `admin@lattice.test` | Admin | everything, including users and addons |
| `editor@lattice.test` | Editor | pages, media, settings, themes (read), activity |
| `author@lattice.test` | Author | own pages (no publishing), media upload, activity |

`pending@lattice.test` is a pending invitation — the invite link is shown once in
the users screen.

## Everyday commands

```bash
php artisan lattice:install [--demo]   # migrate + install addons/themes + storage:link + discover
php artisan lattice:reset-demo --force # drop everything and rebuild the demo site
php artisan lattice:doctor             # health check; exits non-zero when something is broken
php artisan lattice:discover           # regenerate the frontend registries, flush extension caches

php artisan addon:make PostCraft       # scaffold an addon folder
php artisan addon:enable PostCraft     # migrate + activate
php artisan addon:disable PostCraft    # stop booting it, keep every row
php artisan addon:migrate PostCraft    # run pending addon migrations
php artisan addon:remove PostCraft     # uninstall (see --keep-data / --keep-files)

php artisan theme:activate meridian    # switch the public theme
php artisan pages:publish-scheduled    # publish due pages (also runs every minute)
```

## Quality gates

```bash
php artisan test          # Pest, 174 tests
vendor/bin/pint --test    # code style
npm run types:check       # tsc --noEmit
npx eslint resources/js --max-warnings 0
npm run build             # Vite production build
```

All five must pass before a change is considered done. The dashboard query
budget (`≤ 12` queries) is asserted in `tests/Feature/Admin/DashboardTest.php`.

## Where things live

```
app/Cms/                 the platform: manifests, boot, registries, repositories,
                         sections, themes, media, pages, settings, permissions
app/Models/              Eloquent models for the core tables
app/Policies/            authorization for pages, users and media
app/Addons/              one folder per addon (Demo, PostCraft, Shopper)
app/Themes/              one folder per theme (Aperture, Meridian)
resources/js/pages/      Inertia pages; component names map to paths
resources/js/components/ shared UI, editor, media picker, theme shell
docs/                    architecture, addon and theme guides
```

The demo addon (`app/Addons/Demo`) is the smallest complete example: a manifest,
a provider, one route, one migration and an activation hook.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — boundaries, the boot contract,
  why JavaScript is resolved at build time.
- [`docs/ADDON_DEVELOPMENT.md`](docs/ADDON_DEVELOPMENT.md) — a worked addon, from
  `addon:make` to uninstall.
- [`docs/THEME_DEVELOPMENT.md`](docs/THEME_DEVELOPMENT.md) — themes, tokens and
  the section API.

## Troubleshooting

- **“Unable to locate file in Vite manifest”** — run `npm run build` (or
  `npm run dev`).
- **A blank admin page after activating an addon** — run `php artisan
  lattice:discover`; a JS page that does not exist yet needs a build.
- **An addon turned red in the addons screen** — its provider threw during boot;
  the exception is recorded in `last_error` and the app keeps running. Fix the
  addon and activate it again.
- **`lattice:doctor` reports an error** — it names the addon or theme and the
  reason; nothing else in the installation is affected.
