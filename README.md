# Lattice

A self-hosted CMS that is small on purpose: pages with a section-based editor,
a media library, themes, menus, addons and a public site that never depends on a
runtime template engine.

Lattice is **invite-only** — there is no registration screen. An administrator
invites people from `/admin/users`.

## Stack

| Layer          | Choice                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| Backend        | Laravel 13, PHP 8.3+                                                                |
| Frontend       | React 19 (strict TypeScript), Inertia v3, Vite                                      |
| Styling        | Tailwind 4, shadcn/ui, lucide-react, bundled Inter                                  |
| Database       | PostgreSQL 18 under Sail (SQLite for a no-server setup); tests always run on SQLite |
| Tests          | Pest, Pint                                                                          |
| Extra packages | `spatie/laravel-permission`, `spatie/laravel-activitylog`                           |

Everything else — permissions, addons, themes, sections, navigation — is part of
`app/Cms`.

## Quickstart

```bash
git clone <repository> lattice && cd lattice

sail up -d              # app + postgres + mailpit
sail composer setup:demo  # install, .env, key, migrations, Lattice, demo, assets
sail composer dev       # server + queue + logs + Vite
```

Then open <http://localhost:8000>.

`composer setup` is the one command that does the whole install: it copies
`.env.example` to `.env` (skipping an existing `.env`), generates the key, runs
`lattice:install`, then installs the npm packages and builds the assets.
`composer setup:demo` adds `--demo` to the seed.

<details>
<summary>Same steps by hand</summary>

```bash
composer install
cp .env.example .env
php artisan key:generate

npm install && npm run build

php artisan lattice:install --demo
php artisan serve
```

</details>

`.env.example` points at the Sail containers — `DB_CONNECTION=pgsql`,
`DB_HOST=pgsql` and the `lattice` database the Postgres service creates — so
`composer setup` needs `sail up -d` first. Coming from an older checkout with an
existing `.env`? `composer setup` keeps it; `rm .env && cp .env.example .env`
gets the current values.

### Without Docker

SQLite needs no server: set `DB_CONNECTION=sqlite` in `.env` (drop the
`DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` lines), then

```bash
composer setup:demo
php artisan serve      # http://localhost:8000
```

The schema, the seeders and the queries are driver-agnostic, so both setups run
the same code. Tests do not care either way: `phpunit.xml` pins
`DB_CONNECTION=sqlite` with `database/testing.sqlite`, so `sail artisan test`
runs on the file database while the app talks to Postgres.

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

| Email                 | Role   | Can                                               |
| --------------------- | ------ | ------------------------------------------------- |
| `admin@lattice.test`  | Admin  | everything, including users and addons            |
| `editor@lattice.test` | Editor | pages, media, settings, themes (read), activity   |
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

## Switching databases

`sail up -d` always brings up Postgres, and `.env.example` matches it. To move an
existing SQLite install onto it (or the other way round), change the `DB_*`
block in `.env`, then rebuild the schema:

```bash
sail artisan lattice:reset-demo --force   # demo data
# or: sail artisan migrate:fresh --force
```

Going back to SQLite: set `DB_CONNECTION=sqlite`, remove `DB_DATABASE` (a value
there is read as a file path), and run the same command.

## Quality gates

```bash
php artisan test          # Pest, backend behaviour
vendor/bin/pint --test    # PHP code style
vendor/bin/phpstan        # Larastan, level 7
npm run test              # Vitest + Testing Library, component behaviour
npm run types:check       # tsc --noEmit
npx eslint resources/js --max-warnings 0
npm run build             # Vite production build
npm run audit:prod        # production dependencies: must report 0
```

All of these must pass before a change is considered done, and `composer
ci:check` runs them in the order CI does. Two of them need generated files, so
the commands above are the _shared generation step_ — run them from the repo
root, never a bare `tsc`, because `resources/js/{actions,routes}` are build
output (gitignored, produced by Wayfinder) and `resources/js/lib/generated/*.ts` is
produced by `php artisan lattice:discover`:

| Gate                                | Prerequisite                                           | Why                                              |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `npm run types:check`, `npx eslint` | `php artisan wayfinder:generate --with-form`           | route/action helpers are generated TS            |
| `npm run build`                     | same                                                   | the Vite plugin runs it, a manual build does not |
| `php artisan test`                  | `composer install`, migrated `database/testing.sqlite` | Pest boots the app                               |

The npm scripts already chain the registry step (`npm run registry`), so
`npm run build`, `npm run check` and `npm run types:check` regenerate it first.
`npm run test` runs Vitest, which imports no generated module. For a clean
clone, `composer setup` does every step in order.

The dashboard query budget (`≤ 12` queries) is asserted in
`tests/Feature/Admin/DashboardTest.php`.

### Dependency advisories

`npm run audit:prod` is the gate: production dependencies carry **0** known
advisories. The full audit (`npm audit`, dev tooling included) reports 8, all in
packages that only run on a developer machine or in CI:

| Package                    | Severity | Advisory                                                                                                                | Reachable from                             | Status                                                                                                           |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `tinypool`                 | critical | GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr                                                                                | `vite-plus` → `vitest`/`oxfmt` worker pool | Recorded. The fix lands in `vite-plus` 1.4.0, a breaking upgrade; `npm audit fix --force` is not run to take it. |
| `vite-plus`                | critical | GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22, GHSA-vfpm-58rq-9qcg (Vite dev server) and the four `launch-editor` advisories | local `npm run dev` only                   | Recorded; the same major upgrade. The production build is not a dev server.                                      |
| `oxfmt`                    | critical | via `tinypool`                                                                                                          | formatting during the build                | Recorded; same upgrade.                                                                                          |
| `vitest`, `@vitest/mocker` | moderate | GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp                                                                                | test runner                                | Recorded. Both need a Vitest release above 4.1.11; re-audit on the next bump.                                    |
| `fast-uri`                 | moderate | GHSA-w74x-v6f9-j3xg, GHSA-xhq7-xmqj-769h, GHSA-wjr9-j795-jxcr, GHSA-333x-w4r6-6crp                                      | transitive                                 | Not reachable from runtime code — no production path parses untrusted URIs with it.                              |

None of these ship to a visitor: they are reachable only from a repository
checkout that runs the build or the tests. The upgrade that clears most of them
is a deliberate piece of work, not an `--force` in a green build.

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
- **`There are no commands defined in the "setup" namespace`** — the checkout
  predates the `setup:demo` composer script. `git log --oneline -1` and pull.
- **The public site renders inside the admin sidebar, or the admin shows two
  sidebars** — the browser is loading JavaScript that predates your checkout.
  `public/build` is gitignored, so `git pull` never updates it, and a leftover
  `public/hot` makes Laravel serve from a Vite dev server instead. Ask
  `php artisan lattice:doctor` — it reports `Frontend assets` as
  `built <date>`, `dev server <url>` or `stale (… run npm run build)`. Fix with
  `rm -f public/hot && npm run build` and a hard reload.
- **`Error: Port 5173 is already in use`** — another `composer dev` is still
  running (two terminals, or a leftover container). Run one: `sail down &&
sail up -d`, then `sail composer dev` in a single terminal.
- **`WARN The "WWWUSER" variable is not set. Defaulting to a blank string`**
  (and the same for `WWWGROUP`) — `compose.yaml` interpolates both, and
  `vendor/bin/sail` exports them from your host user (`WWWUSER=${WWWUSER:-$UID}`)
  right before it calls compose. If the warning still appears when you run
  `./vendor/bin/sail …` directly, the exports are being dropped on the way to
  the docker CLI. That is the case **inside a distrobox**, where `docker` is a
  symlink to `distrobox-host-exec`: it runs `host-spawn --no-pty docker …`, and
  host-spawn forwards only `TERM` and `PWD` (its `--env` default) — no other
  variable in the container reaches the host process. Compose is reading an
  environment that never had them.

  Both values now default to `1000` in `compose.yaml`, so a first user gets no
  warning and a correct build. Set them in **`.env`** when your ids differ: that
  file is parsed by compose on the host, so it is the one channel that survives
  the host-exec boundary (a value exported in your shell does not). While the
  values were blank, two things were quietly wrong: the image entrypoint runs
  `usermod -u $WWWUSER sail` only when the variable is non-empty, so PHP kept
  the image's uid **1337** and everything it wrote into the bind mount
  (`storage/logs`, `storage/framework`, `bootstrap/cache`, `public/build`) was
  no longer yours; and the next image build would fail, because
  `groupadd --force -g $WWWGROUP sail` had no group id (`--force-recreate`
  reuses the existing image, so that one only shows up when you rebuild). Files
  already written by 1337: `sudo chown -R "$USER":"$(id -gn)" storage
  bootstrap/cache`.

  Unrelated but nearby: if `type -a sail` answers an alias running `sh
  vendor/bin/sail`, that script is **bash**, and `sh` is dash on Debian/Ubuntu —
  no `$UID`, plus bash-only syntax that dash rejects, so Sail's own `.env`
  sourcing and `SAIL_*` forwarding silently stop working. Use a bash alias or a
  function: `sail() { "$([ -f sail ] && echo ./sail || echo ./vendor/bin/sail)" "$@"; }`
- **The browser cannot reach `localhost:8000` under Sail** — the port is
  published only by the current `compose.yaml`; older checkouts served nginx on
  `80` instead. Pull, `sail down && sail up -d`, then check `sail ps` (both
  `8000` and `5173` should be forwarded).
- **`could not translate host name "pgsql"` / `connection refused at
127.0.0.1:5432`** — Postgres is not running or is not the host `.env` expects.
  `sail up -d` starts it; keep `DB_HOST=pgsql` (not `127.0.0.1`, which is the
  container's own loopback). Without Docker, switch to `DB_CONNECTION=sqlite`.
