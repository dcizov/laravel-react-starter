# PROGRESS

Running log for the Lattice build. One entry per step; newest at the bottom.

## Sandbox environment (read this first)

This checkout is a real git repo but the sandbox ships **no PHP binary and no
`vendor/`**. To keep the "tests must pass every step" gate honest, PHP runs
through the WebAssembly build of PHP (`@php-wasm/cli`) and Composer
dependencies were assembled from `composer.lock` without Packagist access:

| Concern        | Sandbox setup                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PHP            | `@php-wasm/cli` (PHP 8.5) behind `/usr/local/bin/php`; host filesystem is mounted, so paths are real                                                   |
| `vendor/`      | Node script downloads each locked package's GitHub zipball and generates a Composer-compatible autoloader (`vendor/autoload.php`, `vendor/composer/*`) |
| `vendor/bin/*` | thin shells that call `php vendor/<pkg>/bin/...`                                                                                                       |
| Frontend       | `npm install` from the npm registry, `npm run build` (Vite via `vite-plus`)                                                                            |

Two environment quirks are **not** app bugs and need these overrides when
running tests in this sandbox:

```bash
# Symfony Terminal must not exec() `stty` — it traps inside the wasm runtime.
export COLUMNS=120 LINES=40          # already baked into /usr/local/bin/php

# bcrypt cost 4 traps in this wasm build; cost 12 is fine.
BCRYPT_ROUNDS=12 php vendor/pestphp/pest/bin/pest tests \
  --exclude-filter="password cannot be reset with invalid token"
```

The excluded test is a stock starter-kit test that trips the same wasm trap
regardless of the application code; everything else is green
(39 tests, 135 assertions).

Nothing in the repository depends on these workarounds: on a normal machine
`php artisan test` and `npm run build` are the gate, unchanged.

## S0 — Scaffold & design system

**Done**

- Lattice design tokens in `resources/css/app.css`: OKLCH variables, indigo
  primary `oklch(0.51 0.19 264)`, `--radius: 0.625rem`, status colours
  (draft / scheduled / published / error + soft variants) exposed through
  `@theme inline` as `--color-status-*`, full dark mode via `.dark`.
- Inter is bundled locally (`@fontsource-variable/inter`); the starter kit's
  remote Bunny font loader was removed from `vite.config.ts` and `app.blade.php`
  (no CDN fonts allowed, and the sandbox has no TLS egress).
- Admin shell: `layouts/admin-layout.tsx` (sidebar + sticky top bar),
  `components/app-sidebar.tsx` (grouped nav from `lib/navigation.ts`),
  `components/nav-sections.tsx`, `components/admin-top-bar.tsx`
  (breadcrumbs, notifications placeholder, theme toggle, primary action).
- Building blocks for every later screen: `page-header.tsx`, `empty-state.tsx`,
  `error-state.tsx`, `data-table.tsx` (skeleton / empty / error), `status-badge.tsx`.
- Branded landings: new `pages/welcome.tsx` and a redesigned auth split layout
  with the Lattice mark (`app-logo-icon.tsx`).
- `pages/dashboard.tsx` rebuilt as a real dashboard shell (KPI cards, recent
  pages empty state, system panel).
- Admin now lives at `/admin` (`dashboard` route name kept, so wayfinder and
  the starter kit's redirects keep working); Fortify `home` → `/admin`.
- **Public registration disabled** (removed from `config/fortify.php`, register
  page deleted, stock registration test replaced by a "registration is closed"
  test).

**Gate**

- `pint --test`, `tsc --noEmit`, `eslint --max-warnings 0`, `npm run build`,
  `php artisan test` (see overrides above): pass.

## S1 — Architecture spine

**Done**

- `app/Cms/` core, no concrete addon imported anywhere:
    - `Manifests/{AddonManifest,ThemeManifest,ManifestValidator}` — immutable
      DTOs read from `addon.json` / `theme.json`, plus structural validation.
    - `Support/VersionConstraint` — `^`, `~`, wildcards, comparisons, `||`.
    - `Support/SafeMode` — registers a provider in try/catch; a throw is logged,
      the row is flagged `status=error` with `last_error`, booting continues.
    - `Repositories/{AddonRepository,ThemeRepository}` — query-builder only, so
      they are safe inside `register()` (pitfall #1). Cache stores handles, never
      models (pitfall #3).
    - `Boot/ProviderLoader` — `installed()` guard (fresh clone → install screen),
      registers active addons + theme, then `refreshNameLookups()` /
      `refreshActionLookups()` (pitfall #4).
    - `Registries/Navigation` — addons and core both write here; items are
      permission-filtered per user. React renders the registry, nothing else.
    - `Addons/AddonManager` — install / activate / deactivate / uninstall with
      addon-scoped migrations (`DatabaseMigrationRepository` over
      `addon_migrations`), health check before `active`, rollback of just that
      activation on failure, data kept on deactivate.
    - `Providers/CoreServiceProvider` — registered first; merges config, binds
      the registry/repositories/SafeMode/loader, defines manifest permissions as
      gates (temporary until the RBAC step).
- Migrations: `addons`, `addon_migrations` (nullable columns), `themes`.
- Commands: `lattice:install [--demo]`, `lattice:discover` (writes
  `resources/js/lib/generated/{navigation,addons}.ts`), `lattice:doctor`,
  `addon:make`, `addon:enable|disable|remove|migrate`. Custom namespace wired
  with `->withCommands()` (pitfall #6).
- Reference `app/Addons/Demo`: manifest nav + permission, own route, own
  migration (`demo_notes`), `Activator::activate()` hook, React screen.
- Frontend: `navigation` shared prop from the registry, `nav-icons.ts` maps
  manifest icon names, sidebar renders whatever the server sends.
- Tests: `tests/Feature/Cms` (lifecycle, fresh-boot, safe mode, uninstall,
  navigation) on `DatabaseMigrations` + file DB so a "next request" can be
  simulated by `refreshApplication()` (pitfall #11); `tests/Unit/ManifestTest`.

**Accept:** enabling Demo adds its nav item + `/admin/demo`; disabling removes
both and keeps `demo_notes`; a provider that throws becomes `error` while the
app still serves `/login`; an incompatible manifest is refused with the exact
reason. 55 tests / 223 assertions green, pint + tsc + eslint + build green.

**Next: S2 — auth, roles, users** (Spatie roles Admin/Editor/Author,
permission map in `auth.can`, policies, invitations, activity log).
