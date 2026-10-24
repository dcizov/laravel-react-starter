# Architecture

Lattice is a Laravel application with a CMS layered on top of it. The layering is
strict: `app/Cms` is infrastructure, `app/Models` is data, `app/Http` is HTTP and
`resources/js` is presentation. Addons and themes may use all four, but the core
never knows about them by name.

## Boundaries

```
app/Cms/Manifests      addon.json / theme.json, parsed into immutable value objects
app/Cms/Boot           ProviderLoader — the only place the database decides what boots
app/Cms/Repositories   addons, themes — query builder only (they run before Eloquent)
app/Cms/Registries     Navigation, SectionRegistry
app/Cms/Themes         ThemeManager (activation, tokens, component resolution)
app/Cms/Sections       Section, Field, CoreSections
app/Cms/Media          MediaLibrary — the only code that touches media bytes
app/Cms/Pages          PageRepository — slugs, revisions, publishes, scheduling
app/Cms/Settings       SettingSchema + SettingRepository
app/Cms/Permissions    AbilityMap (the `auth.can` map)
app/Cms/Console        all `lattice:*` and `addon:*` commands
app/Cms/Support        SafeMode
```

Two rules keep this honest:

1. **Core never imports an addon or theme class.** It asks a manifest for a
   provider name and registers it by string.
2. **Extensions never patch the core.** An addon ships migrations, routes,
   permissions, navigation and sections; it does not edit `config/lattice.php`,
   the React sidebar or another addon.

## The boot contract

A request boots in a fixed order, and only one step reads the database:

```
bootstrap/providers.php
  └── App\Cms\Providers\CoreServiceProvider::register()
        ├── merge config/lattice.php
        ├── bind Navigation, AddonRepository, ThemeRepository, SectionRegistry,
        │        SafeMode, ProviderLoader, AbilityMap, SettingRepository
        ├── ProviderLoader::register()
        │     ├── if the `addons` table is missing → stop (installer screen)
        │     ├── for each active addon: register its provider inside SafeMode
        │     │     └── provider loads its routes, views, sections
        │     ├── register the active theme's provider the same way
        │     └── refresh the router's name/action lookups
        └── (later) ProviderLoader is also re-run by AddonManager on activation
  └── routes/web.php, routes/admin.php, routes/settings.php, auth routes
  └── CoreServiceProvider::boot()
        ├── register core navigation from config
        └── SettingRepository::applyToConfig()  (site identity over config)
```

Consequences worth knowing:

- **A broken extension cannot take the app down.** `SafeMode::register()` catches
  the throwable, records `status = error` and the message on the row, logs it and
  lets boot continue. The addons screen and `lattice:doctor` both read that.
- **Routes are registered before they are looked up.** Because providers register
  after the router is built, the loader refreshes the route collection's name and
  action lookups; otherwise `route()` would miss an addon's routes.
- **Repositories use the query builder, not Eloquent.** They run before the
  connection resolver is wired, so `AddonRepository`/`ThemeRepository` never touch
  a model.
- **The database decides, the disk only describes.** A folder on disk is a
  *candidate*. Activation writes a row, and only the row makes a provider boot.
  The manifest stored in the row wins over the file, so editing a folder cannot
  silently change what the running site requires.

## Requests

```
web middleware
  └── HandleInertiaRequests
        ├── auth.user + auth.can            AbilityMap (2 queries)
        ├── navigation                      Navigation registry, permission-filtered
        ├── settings.public                 SettingRepository (cached)
        ├── notifications (deferred)        Inbox — the bell never blocks first paint
        └── flash.toast
```

Admin requests then go through `auth`, `verified`, `active`, and each action
authorizes again with a gate or a policy plus a FormRequest. The client's
`auth.can` map hides affordances; it never authorizes anything.

### The public root

`GET /` is answered by `App\Cms\Content\Homepage`, which reads the
`content.homepage_slug` setting (schema default `home`) and only accepts a page
that is publicly visible *right now*. A draft, scheduled, expired or trashed
homepage leaves the core landing page (`welcome`) in place. The same helper
decides which slug the sitemap writes as `/` and which menu items link to `/`,
so there is one answer to "which page is the homepage" in the whole app.

### Appearance (light/dark) and hydration

`system` cannot be resolved on the server, so the decision is never derived
during render:

1. `HandleAppearance::read()` normalises the `appearance` cookie and pairs it
   with `appearance_resolved` — the value the browser reported last time
   (light on a first visit).
2. The root template writes both onto `<html>` (`class="dark"`,
   `data-appearance`, `data-appearance-resolved`), and `HandleInertiaRequests`
   shares the same pair as the `appearance` prop.
3. `resources/js/hooks/use-appearance.tsx` seeds its store from the shared props
   (`withApp` runs before the first render on both sides) and falls back to the
   html attributes, so the first client render is byte-identical to the SSR
   pass. Only *after* hydration does a listener re-resolve `system` against
   `matchMedia`, correct the document and refresh the cookie.

Nothing renders from `matchMedia` during render, which is what keeps
`ThemeToggle` and the toaster in agreement with their server output.

## Authorization

Policies and gates are named after permissions (`pages.update`,
`addons.manage`, `settings.view`). The role matrix lives in `config/lattice.php`
as data and is seeded by `RolePermissionSeeder`; addon manifests add their own
permissions, so an addon never edits the config. `Admin` receives every
permission that exists, including addon ones.

## JavaScript is resolved at build time

The public site and the admin are React, but **no page fetches its data from an
ad-hoc API**:

- Every screen is an Inertia page. The server sends props, the client renders
  them. There is no client-side data fetching, no duplicated server state in
  component state, and no business logic in React.
- `lattice:discover` writes `resources/js/lib/generated/{navigation,addons}.ts`
  and flushes the extension caches. Nothing is discovered at runtime — if a file
  is missing from the build, the build fails rather than the browser guessing.
- Component names map to `resources/js/pages/*.tsx` (`admin/settings/index` →
  `resources/js/pages/admin/settings/index.tsx`). Addon screens live in the same
  tree, which is why activating an addon whose JS is not built yet needs
  `npm run build`.
- The only JSON endpoint outside Inertia is `/admin/media/browse`, used by the
  media picker so opening it never re-renders the page being edited.

## Data

Core tables: `users`, `invitations`, `pages`, `page_revisions`, `page_slugs`,
`media`, `media_folders`, `media_usages`, `menu_items`, `settings`, `addons`,
`addon_migrations`, `themes`, `activity_log`, `notifications`, `page_views`.

Addon tables are created **only** by addon migrations (`posts`, `categories`,
`tags`, `post_tag` for PostCraft) and are tracked in `addon_migrations` so
deactivation keeps the data and uninstallation can roll it back deliberately.

## Caching

Only handles, IDs and scalars are cached (`lattice.addons.active`,
`lattice.theme.active`, `lattice.navigation`, `lattice.settings.public`) — never
models or collections. Any lifecycle command or activation flushes them;
`SettingRepository::put()` forgets the public payload so a saved name reaches the
next request.

## Safe Mode, in one paragraph

When a provider throws, Lattice keeps serving. The row is marked `error` with the
message, the screen shows it with a readable explanation, and `lattice:doctor`
exits non-zero. Nothing else is affected — the intent is that a half-finished
addon is a visible annoyance, not an outage.
