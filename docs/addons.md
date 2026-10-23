# Addons: developer guide

This guide covers the first phase of the addon infrastructure. It describes what the code does now and what it does not do yet. Built-in features (`FEATURES`, `config/features.php`, `App\Features\*`) are unchanged and are not managed by addons.

## Status of this phase

- Addons are local folders under `addons/`. They are installed and activated from the command line.
- No admin UI, no uploads, no remote fetch, no Composer, npm or Packagist discovery, no themes.
- No addon can be removed, uninstalled or purged. This phase has no uninstall path.
- Route gating, permission handling and the compiled manifest are **provisional** until they have been verified on a real PostgreSQL database and with `route:cache` (see [Verification](#verification)).

## Folder layout

```
addons/
  <slug>/                  folder name must equal the slug
    addon.json             the manifest (required)
    src/                   code, including the provider class
    routes/web.php         optional, loaded under /addons/<slug>
    database/migrations/   optional, run by the lifecycle, not by php artisan migrate
    config/<slug>.php      optional, merged into config('addons.<slug>')
    lang/<locale>/         optional, translations under the namespace <slug>
```

The folder list comes from `config/addons.php` (`paths`, default `base_path('addons')`).

## Manifest (`addon.json`)

```json
{
    "name": "vendor/lifecycle-fixture",
    "slug": "lifecycle-fixture",
    "version": "1.0.0",
    "label": "Lifecycle fixture",
    "core": "^1.0",
    "provider": "Fixtures\\LifecycleFixture\\LifecycleFixtureServiceProvider",
    "requires": { "addons": {} },
    "provides": {
        "routes": "routes/web.php",
        "permissions": ["lifecycle-fixture.view"],
        "migrations": "database/migrations",
        "tables": ["lifecycle_fixture_items"],
        "config": "config/lifecycle-fixture.php",
        "translations": "lang"
    }
}
```

| Field                   | Rule                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                  | Composer-style `vendor/package`. The part after the slash must equal the slug.                                                                                                                                |
| `slug`                  | Lowercase letters, digits and single hyphens, starts with a letter, at most 40 characters. Unique across all folders. Must not be reserved (see `config/addons.php`, which also reserves every feature slug). |
| `version`               | Semantic version `X.Y.Z`, with an optional pre-release or build suffix.                                                                                                                                       |
| `label`                 | Non-empty, at most 120 characters.                                                                                                                                                                            |
| `core`                  | Version constraint. Must include `config('addons.core_version')`.                                                                                                                                             |
| `provider`              | Optional. A fully qualified `ServiceProvider` class that autoloads.                                                                                                                                           |
| `requires.addons`       | Map of addon slug to version constraint. Dependencies must be installed, have a matching version, and be active before activation. Cycles are reported.                                                       |
| `provides.routes`       | Relative path to a PHP file inside the addon folder.                                                                                                                                                          |
| `provides.permissions`  | List. Each name starts with `<slug>.` followed by an action, for example `lifecycle-fixture.view`. Must not clash with a core or feature permission.                                                          |
| `provides.routes_mount` | Optional. `addon` (default) mounts the routes under `/addons/<slug>`. `root` keeps the URLs and route names the routes file gives, for an addon that replaces a built-in page. Needs `provides.routes`.       |
| `provides.migrations`   | Relative path to a folder of migration files.                                                                                                                                                                 |
| `provides.tables`       | List. Each name starts with the slug, with hyphens turned into underscores, followed by `_`. Lowercase, at most 63 characters (PostgreSQL's identifier limit).                                                |
| `provides.config`       | Relative path to a PHP file that returns an array.                                                                                                                                                            |
| `provides.translations` | Relative path to a folder containing `<locale>/` subfolders.                                                                                                                                                  |
| `provides.pages`        | Optional list of `{"page": "<name>", "layout": "public" or "app"}`. `page` is a file under `resources/js/pages` without `.tsx`. Both keys are required; names are unique within the addon. See Pages.         |

Only these top-level fields and these `provides` keys are accepted. Anything else is reported as unknown. Validation reports every problem found in one pass, so a manifest can be fixed in one edit. The rules live in `App\Addons\Manifest\ManifestValidator`.

## Discovery

`php artisan addons:discover` reads every `*/addon.json` under the configured folders. It changes nothing. It prints the valid addons and then the problems, grouped by file. It exits non-zero if any problem exists.

Discovery reports:

- invalid JSON, a non-object root, and a missing file;
- every validation error for each file;
- the same slug in two folders (both files are named);
- dependency cycles.

## Lifecycle

| Command                          | What it does                                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addons:install <slug>`          | Records the addon as `installed` and recompiles the manifest. The addon stays switched off.                                                                                                                               |
| `addons:activate <slug>`         | Runs pending migrations, records each one, syncs permissions, sets `active` and `enabled`, and recompiles.                                                                                                                |
| `addons:activate <slug> --adopt` | For tables that already exist. Checks that each declared table exists, records every migration as run without running it, then activates as above. Fails and records nothing if a table is missing.                       |
| `addons:deactivate <slug>`       | Sets `inactive` and `enabled = false`, removes the addon's permissions from every role, and recompiles. Code, tables and data are kept. No down-migrations run. Refused while an active addon depends on it.              |
| `addons:compile`                 | Rewrites `bootstrap/cache/addons.php` from the database and the addon folders.                                                                                                                                            |
| `addons:update <slug>`           | Accepts a changed `addon.json`: records its new version and checksum, runs pending migrations if the addon is active, syncs permissions, and recompiles. See [Changed `addon.json`](#changed-addonjson).                  |
| `addons:list [--check]`          | Lists installed addons. With `--check`, exits non-zero if the compiled manifest is missing, unreadable or out of date, or if an addon's `addon.json` changed after install. Each problem names the command that fixes it. |

Statuses are the strings `installed`, `active`, `inactive` and `failed`. The database column is a plain string, validated in code.

### What every operation does

1. Takes the cache lock `addons:lifecycle` (300 seconds). If another operation holds it, the command fails with a message.
2. Copies the current compiled manifest to `bootstrap/cache/addons.last-good.php`.
3. Runs the work. Install and deactivate change the database and recompile in one transaction. Activation runs each migration in its own transaction together with its `addon_migrations` row, then changes the addon's status and recompiles in a second transaction.
4. On failure: restores the last-good manifest, writes an `addon.failed` audit entry, and, for an activation that failed, sets `status = failed` with `last_error` and keeps it switched off. Migrations that finished before the failure stay recorded and are not run again.

If no last-good copy exists, the operation had no compiled manifest to return to. A failed operation then removes the manifest it wrote, so the app is back to "no manifest", which enables no addons and logs a warning. It never leaves an empty or half-written manifest behind.

Install refuses an addon whose folder is invalid. Activation refuses a table that already exists but is not recorded as this addon's, so an addon cannot silently take over another table.

### Errors

Every lifecycle operation throws an `AddonException`, which the commands print as a message:

- Refusals and addon problems keep their own type: `AddonLifecycleException` (for example "already active"), or `AddonManifestException` (for example a changed `addon.json`).
- Any other failure, such as a failing listener, a filesystem error or a database error, is wrapped in an `AddonLifecycleException` with the message `Could not {install|activate|deactivate} [{slug}]. {original message}`. The original exception is kept as the previous exception, so it can be read in logs and tests.

Both kinds are audited as `addon.failed`, and the database and the manifest are restored as described above.

## Compiled manifest

`bootstrap/cache/addons.php` is a PHP array returned by a file, with:

- `addons`: every installed addon keyed by slug, with its manifest fields, `status`, and `enabled`. An addon whose `addon.json` changed after install has `enabled = false`, `drifted = true`, no routes, pages or permissions, and the entry it was last compiled with under `recorded`;
- `state_checksum`: a hash of the slug, version, enabled flag and manifest checksum of each addon;
- `generated_at`, `format`.

Web requests read only this file through `AddonRegistry`. They never query the `addons` table. If the file is missing or unreadable, no addons are enabled and a warning is logged once per process. The file is written through a temporary file and a rename, so readers see either the old or the new version.

The file is generated. Do not edit it by hand. It is in `bootstrap/cache/`, which is git-ignored.

## Changed `addon.json`

An installed addon is recorded with the SHA-256 of its `addon.json` bytes. A reformat counts as a change. When the file changes:

- **That addon is switched off, and no other addon is affected.** `compile()` records it as drifted, and the other addons compile and activate or deactivate as usual. Boot checks the file of each enabled addon once per process. A drifted addon is off for that process, and one warning names it. Boot never throws.
- **Nothing accepts the new file automatically.** The only way forward is `php artisan addons:update {slug}`.
- **`addons:update` reads the file again and validates it.** An invalid file is refused, and nothing is recorded. A changed slug or package name is refused, because it is not an update. A changed set of declared tables needs `--allow-tables`, because it is a data-safety change. A version lower than the recorded one needs `--force`, which prints that migrations are not reversed. `--dry-run` prints the changes and writes nothing.
- **Applied, it runs under the same lock and rollback as every lifecycle operation.** Pending migrations run first if the addon is active, then the version and checksum are recorded with the recompile, the permission sync and an `addon.updated` audit entry. Running it again with nothing changed does nothing and exits 0.

### Versions

The `version` in `addon.json` and the installed version move together, and `addons:update` is what moves the installed one. A version bump in the file alone does not change the installation until the command runs.

A release that changes an addon's manifest is a release note with these steps: `git pull`, rebuild the frontend, run `php artisan addons:update {slug}` for each changed addon, run `php artisan addons:list --check`, then `php artisan route:cache` if routes are cached. Until the command runs, the changed addon is off.

## Routes and middleware

The routes of every installed addon are registered under `/addons/<slug>` with the name prefix `addons.<slug>.`. Each group uses the middleware `addon.active:<slug>`, which returns 404 while the addon is not active. Because the routes stay registered, switching an addon on or off does not change the route set, so the route cache stays valid. Only installing a new addon changes the route set.

When `provides.routes_mount` is `root`, the routes are mounted at the root and keep the URLs and names their file gives. Use it only for an addon that takes over a page with a fixed URL, such as the newsletter pages at `/newsletter` and `/admin/newsletter`. The `addon.active` middleware still applies, so the page answers 404 while the addon is inactive.

Addon routes must use controller classes, not closures, or `php artisan route:cache` fails. The routes are registered only when the routes are not cached.

## Pages

`provides.pages` lists the front-end pages an addon adds. Each entry names a file under `resources/js/pages` and the layout it uses:

```json
"pages": [
    {"page": "subscribe", "layout": "public"},
    {"page": "admin/newsletter", "layout": "app"}
]
```

- `page` is the path under `resources/js/pages`, without the `.tsx` extension. Use letters, digits, hyphens and underscores, with `/` between folders. Dots, `..`, and absolute paths are refused. The file is resolved, so a symlink that leaves the pages folder is refused too.
- `layout` is required. `public` has no app shell. `app` uses the admin shell.
- Names are unique within one addon. There is no cross-addon rule: Inertia names an addon page `<slug>::<page>`, so two addons cannot collide.
- A page is shown only while its addon is active. The build includes every declared page. The browser loads an addon page only when the `addons` shared prop lists the addon, so deactivating an addon takes its pages off without a rebuild.
- A page file under `resources/js/pages` that is not declared is not built or mounted. The compiler logs a warning naming the file.
- An addon without `provides.pages` contributes no pages.
- `url` is optional. It is a static path such as `"/newsletter"`, the public address of the page. Core links to the page through it, and only while the addon is active. A `url` may not contain a query string, a route parameter, `//`, `..`, or a full URL. Each declared `url` must reach a route whose controller lives in the addon's folder. `AddonPageRoutes` checks this in the test suite, so a renamed route fails a test instead of leaving a dead link.
- A `POST` form action is not a page, so it is not declared here. It stays in the addon's routes file.

The build reads the page list from `resources/js/generated`, which `npm run addons:pages` writes from every `addons/*/addon.json`. Run it after adding or changing a page, and commit the result. `npm run build` fails when the generated files are stale, and `npm run test:js` checks them against the manifests.

## Permissions

Addon permissions are created and assigned to `admin` on activation (`Rbac::syncFeaturePermissions`). `Rbac::permissions()` includes the active addons' permissions, so turning a feature on or off does not remove them from `admin`.

On deactivation the addon's permissions are removed from every role and from every user who was granted one directly. Their permission rows are kept, so a later activation finds them again. This is the chosen policy: the addon's permissions are gone from all holders when it is off, and nothing is left orphaned. Re-grant them after reactivation if a user still needs them.

## Deployment order

On a server that uses route caching:

1. Deploy the code and run `composer install --no-dev --optimize-autoloader`.
2. Run `php artisan migrate --force` for the application's own migrations. This creates the `addons` and `addon_migrations` tables.
3. Run the addon commands you need: `addons:install`, then `addons:activate`.
4. Run `php artisan addons:compile` if the manifest is not already current, then `php artisan addons:list --check`.
5. Run `php artisan config:cache` and `php artisan route:cache` last.

Install and activation run only from the command line, during a controlled deployment. There is no admin upload and no remote fetch.

`bootstrap/cache/` is git-ignored, so a fresh checkout, a new container, or a deploy that wipes `bootstrap/cache/` has no compiled manifest. Until `php artisan addons:compile` runs, no addon is enabled, the newsletter card and sign-up links are gone, and one warning is logged. The database still records the addons as active. Run `addons:compile` as the last step of every deploy. `optimize:clear`, `config:clear` and `cache:clear` do not remove `bootstrap/cache/addons.php`: they remove Laravel's own cache files, as listed in the framework's `OptimizeClearCommand` and `ClearCompiledCommand`.

Do not run `php artisan migrate:fresh` on an installation that has addons. It drops the `addons` table but leaves the compiled manifest and the addon folders in place. `addons:list --check` reports this as out of date.

## Recovery

- **Activation failed:** the command prints the error. Fix the cause, then run `addons:activate` again. Migrations that finished are not run twice.
- **Compiled manifest is missing or corrupt:** run `php artisan addons:compile`. Until then no addons are enabled, and a warning is logged.
- **Manifest is out of date:** `addons:list --check` says so. Run `addons:compile`.
- **An addon's `addon.json` changed after install:** that addon is switched off, and the others keep working. Check the file with `git diff`. If the change is intended, run `php artisan addons:update {slug}`. If it is not, restore the installed file, then run `php artisan addons:compile`.
- **Restore the last good state by hand:** copy `bootstrap/cache/addons.last-good.php` over `bootstrap/cache/addons.php`. Note that the database still holds the failed state, so run `addons:compile` afterwards.

## Testing

- `tests/Unit/Addons/ManifestValidatorTest.php`: manifest rules, discovery errors, duplicate slugs and cycles. It needs no database.
- `tests/Unit/Addons/ArchitectureTest.php`: dependency boundaries (Pest arch plugin). Addon code must not import `App\Features`. The fixture must not import core or other addons.
- `tests/Feature/Addons/AddonLifecycleTest.php`: install, activate, deactivate, route gating, permissions, migration tracking, compile, failure at migrate and at compile, recovery, and a changed manifest. It runs in a temporary addon root (`Tests\Support\Addons\AddonSandbox`), so it never writes to `bootstrap/cache` or `addons/`.
- `tests/Feature/Addons/NewsletterAddonTest.php`: the real Newsletter addon through the same lifecycle. It checks that admin gets `newsletter.manage` on activation, that routes answer 404 while inactive, and that deactivation keeps the subscriber rows and table. Reactivation restores the routes. The feature tests call `activateNewsletterAddon()` from `tests/Pest.php`.
- `tests/Feature/Addons/AddonCommandsTest.php`: exit codes of the commands.
- `tests/Fixtures/addons/lifecycle-fixture/`: the test-only addon. Its namespace `Fixtures\LifecycleFixture\` is mapped in `autoload-dev`. It is not shipped. Its migration has a test seam: `config('addons.lifecycle-fixture.fail_at') === 'migrate'` makes it throw after creating its table.

- `tests/Feature/Addons/AddonDriftTest.php`: one drifted addon does not stop another from being activated or deactivated; a drifted addon's routes and pages are not compiled; boot-time drift switches an addon off with one warning; boot does not throw.
- `tests/Feature/Addons/AddonUpdateTest.php`: `addons:update` records a change and is a no-op the second time; a dry run writes nothing; an invalid file, a changed name, a changed table set without `--allow-tables`, and a downgrade without `--force` are refused; the command's exit codes.
- `tests/Feature/Addons/PageUrlRoutesTest.php`: every declared `url` of the newsletter addon reaches a route of that addon; a missing route, a core route and a page without a url are handled.
- `tests/Feature/Addons/CoreWithoutAddonsTest.php`: core boots and renders with no addons folder and no compiled manifest, reads no addon table, and warns once.
- `resources/js/lib/addon-boundary.test.ts`: the frontend guard. Core frontend code must not import an addon's generated routes.

Run them with `php artisan test --filter=Addon` (or `composer test`).

**In a checkout with `addons/newsletter` removed, these newsletter-named tests fail, by design.** They are about the newsletter addon, which ships in this repository. A suite that passes with the addon deleted would prove nothing about it. They are `resources/js/lib/addon-pages.test.ts` and `resources/js/components/cms/public-layout.test.tsx`, and the newsletter cases of the Pest suites, which are expected to fail there but were not run in a stripped tree. The frontend guard test was run in one, and passes. Do not read these failures as breakage.

## Limitations

- No remove, uninstall or purge. Deactivated addons keep their code, tables and data indefinitely.
- Updates are local and explicit. `addons:update` is the only way to accept a changed `addon.json`. Nothing fetches a new version.
- Local folders only. No Composer, npm, VCS or Packagist discovery.
- Migrations are not reversed. Addon migrations must be written to be safe to re-run after a partial failure on databases without transactional DDL.
- **Supported database: PostgreSQL.** CI runs on PostgreSQL, and `.env.example` selects it. SQLite is for local and test convenience only.
- **MySQL is not supported for addon migration rollback.** MySQL commits DDL implicitly, so a failed addon migration cannot be rolled back there. Do not run addons on MySQL. This is a stated limitation, not a tested one. CI does not test MySQL, and no MySQL job is planned.
- `composer.json` still maps `Addons\\Newsletter\\` to `addons/newsletter/src/`. Removing the addon leaves that mapping in place until it is removed by hand. Not verified here whether that is harmless in practice; check it on the user's machine.
- Built-in features are not managed by addons. `FeatureManager` and `FEATURES` are unchanged.
- `addons/` is not git-ignored. Commit addons deliberately, as code.

## Verification

This phase was written without a local PHP runtime. Nothing here has been run until the commands in the phase report have been run and their results reported.
