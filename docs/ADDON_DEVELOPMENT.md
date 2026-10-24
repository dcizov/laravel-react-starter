# Addon development

An addon is a folder in `app/Addons` plus a row in the `addons` table. The
folder is a candidate; the row decides whether it boots. This guide walks from
`addon:make` to uninstall, using the two addons that ship with Lattice as
references: `Demo` (the smallest complete addon) and `PostCraft` (routes, admin
screens, migrations, permissions, a section and a public site).

## 1. Scaffold

```bash
php artisan addon:make Widgets
```

That writes `app/Addons/Widgets`:

```
addon.json                   the manifest
WidgetsServiceProvider.php   routes, views, sections
Activator.php                the lifecycle hook
routes/admin.php             admin routes
routes/public.php            public routes
database/migrations/         created only by this addon
database/seeders/
```

## 2. The manifest

`addon.json` is validated before anything is written to the database. `handle`
must be StudlyCase; `handle`, `name`, `version` and `provider` are required.

```json
{
    "handle": "Widgets",
    "name": "Widgets",
    "version": "1.0.0",
    "description": "Small blocks for campaign pages.",
    "author": "Northwind",
    "provider": "App\\Addons\\Widgets\\WidgetsServiceProvider",
    "requires": {
        "php": "^8.3",
        "laravel": "^13.0",
        "lattice": "^0.1",
        "addons": ["PostCraft"]
    },
    "permissions": ["widgets.view", "widgets.manage"],
    "navigation": [
        {
            "section": "Content",
            "label": "Widgets",
            "route": "/admin/widgets",
            "icon": "layout-grid",
            "permission": "widgets.view",
            "order": 35
        }
    ],
    "migrations": true,
    "seeders": [],
    "settings": {},
    "resources": [],
    "sections": [
        { "class": "App\\Addons\\Widgets\\Sections\\WidgetStrip" }
    ]
}
```

| Key | Meaning |
|---|---|
| `requires.php` / `.laravel` / `.lattice` | Composer-style constraints checked **before** install and activation. `Shopper` ships with `lattice: ^2.0` to demonstrate the refusal. |
| `requires.addons` | Handles that must be installed and active first. |
| `permissions` | Registered by `RolePermissionSeeder` and granted through the roles screen. `Admin` gets them automatically. |
| `navigation` | Sidebar entries. `section`, `label`, `route` are required; `permission`, `icon` and `order` are optional. The React sidebar is generated from this — never edited. |
| `migrations` | `true` (default) makes activation run everything in `database/migrations`, tracked per file in `addon_migrations`. |
| `sections` | Section classes contributed to the page builder. |
| `settings`, `resources`, `seeders` | Declared for the addon screen and tooling; seeders run by the seeder, not at activation. |

The manifest is copied into the `addons` row at install time. **The stored
manifest wins**: editing `addon.json` after install does not change what the
running site requires until the addon is reinstalled.

## 3. The provider

```php
final class WidgetsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/routes/admin.php');
        $this->loadRoutesFrom(__DIR__.'/routes/public.php');
        $this->loadViewsFrom(__DIR__.'/resources/views', 'widgets');

        $this->app->make(SectionRegistry::class)->add(WidgetStrip::make());
    }
}
```

The provider boots **only when the addon row is active**, inside `SafeMode`. If
it throws, the app keeps running, the row turns `error` with the message, and
`lattice:doctor` reports it.

Guard the routes you register with `EnsureAddonActive`, so a cached route table
or a long-lived worker cannot serve a deactivated addon:

```php
Route::middleware(['web', EnsureAddonActive::class.':Widgets'])
    ->prefix('admin')
    ->group(function (): void {
        Route::get('widgets', [WidgetController::class, 'index'])->name('widgets.admin.index');
    });
```

## 4. Migrations and lifecycle

Name addon migrations with a timestamp **and** the addon in the file name; two
migrations may never share a class name:

```
app/Addons/Widgets/database/migrations/2026_10_24_000300_create_widgets_table.php
```

Lifecycle (`AddonManager`):

| Step | What happens |
|---|---|
| **discovered** | folder on disk, no row; the catalog shows it as *not installed* |
| **install** | manifest validated → `requires` checked → row written as `inactive`. No tables, no routes. |
| **activate** | migrations run and are recorded in `addon_migrations` → `Activator::activate()` → caches flushed → health check (provider class must exist). A failure rolls the migrations back and marks the row `error`. |
| **deactivate** | provider stops booting, navigation entry disappears, routes 404. **Every row is kept.** |
| **uninstall** | `--keep-data` decides whether the migrations recorded for that addon are rolled back; `--keep-files` decides whether the folder is deleted. |

Because deactivation keeps data and the tables, re-activating is instant and
lossless. `PostCraft` proves this in `tests/Feature/Addons/PostCraftTest.php`.

## 5. Permissions and authorization

Declare permissions in the manifest, then authorize every action in the
controller (gate) and validate with a FormRequest. The permissions land in the
`auth.can` map, which the client uses to hide affordances — never to authorize.

```php
$this->authorize('widgets.manage');          // in the controller
// app/Http/Requests/Admin/UpdateWidgetRequest::authorize() → can('widgets.manage')
```

## 6. Admin screens

Inertia pages live in the same tree as everything else:

```
resources/js/pages/widgets/index.tsx     ← Inertia::render('widgets/index')
```

Component names map to paths, so a new screen means a new file **and**
`npm run build`. `lattice:discover` regenerates `resources/js/lib/generated/*`
(navigation and the addon list) and flushes the extension caches — run it after
changing a manifest.

Reuse the shared kit: `AppLayout`, `PageHeader`, `EmptyState`, `StatusBadge`,
`ui/*`, skeletons for loading, an explicit empty state, and
`router.optimistic()` for the four optimistic actions (publish, addon switch,
delete-with-undo, settings boolean).

## 7. Sections

A section is a PHP declaration plus a React renderer:

```php
Section::make('widget-strip', 'Widget strip', [
    Field::text('heading', 'Heading', ['required' => true]),
    Field::number('limit', 'How many', ['default' => 3]),
], [
    'description' => 'Three widgets in a row.',
    'icon' => 'layout-grid',
    // Optional: data the core resolves for every block of this section.
    'data' => fn (): array => ['widgets' => Widget::query()->limit(3)->get()->toArray()],
]);
```

Field types: `text`, `textarea`, `richtext`, `number`, `boolean`, `select`,
`url`, `media`, `color`, `repeater`. Then add a case for `widget-strip` in
`resources/js/components/sections/section-renderer.tsx`; if the section supplied
a `data` closure, the resolved array arrives as the `data` prop of that case
(this is how the PostCraft blog teaser fills itself from live posts).

## 8. Public routes

Public addon routes are ordinary Laravel routes registered in
`routes/public.php`. Remember two things:

- **Register machine endpoints before catch-alls.** PostCraft puts
  `/blog/rss.xml` above `/blog/{slug}`.
- **Render through the active theme**, not with your own chrome:
  `Inertia::render('blog/index', $themeShell + [...])` where the shell comes from
  `ThemeManager`/`MenuRepository`. An addon must not ship a second design.

## 9. Enable, and test it

```bash
php artisan addon:enable Widgets
php artisan addon:disable Widgets
php artisan addon:migrate Widgets
php artisan addon:remove Widgets --keep-data
```

Tests install a manifest without going through the filesystem helper, and boot a
second application when route registration order matters:

```php
$manifest = collect(app(AddonRepository::class)->discovered())->firstWhere('handle', 'Widgets');

app(AddonRepository::class)->install($manifest);
app(AddonManager::class)->activate('Widgets');
test()->refreshApplication();   // the next request, booting from the database
```

`tests/Feature/Addons/` runs on `DatabaseMigrations` for exactly that reason.

## Checklist

- [ ] `handle` StudlyCase, provider class exists
- [ ] `requires` honest — including the Lattice version you tested against
- [ ] every route behind `EnsureAddonActive`; every mutation authorized + validated
- [ ] migrations prefixed, and rollback-safe
- [ ] navigation entry declares the permission it needs
- [ ] loading, empty and error states on every screen
- [ ] deactivation keeps data; uninstall is explicit about what it removes
- [ ] `php artisan test`, `pint --test`, `tsc`, `eslint`, `npm run build` green
