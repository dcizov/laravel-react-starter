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

## S2 — Auth, roles, users

**Done**

- `spatie/laravel-permission` 6.22 + `spatie/laravel-activitylog` 4.12
  (fetched into `vendor/` by the sandbox toolchain, declared in
  `composer.json`), providers registered explicitly in `bootstrap/providers.php`,
  configs published, permission + activity migrations converted to anonymous
  classes (the published stubs redeclared their class names).
- Role matrix is **data** in `config/lattice.php` (`roles`, `admin_only_abilities`),
  turned into Spatie roles/permissions by `RolePermissionSeeder`. Addon
  manifest permissions are synced on activation (`Cms\Permissions\PermissionSync`),
  so a newly enabled addon is usable immediately.
- `AbilityMap` builds `auth.can` from the permission table; `auth.user` is now a
  small array, never a model.
- `UserPolicy` + explicit `Gate::policy` mapping; `pages`/`media` policies land
  with their models. `User` gained `HasRoles`, `avatar_url`, `preferences`,
  `is_active`, `last_login_at`, `isLastAdmin()`; `last_login_at` is written by a
  `Login` event listener.
- Invite-only signup: `invitations` table (hashed token, 7-day expiry),
  `InvitationNotification`, public `GET/POST /invitations/{token}` with a
  dedicated React screen, invitation revoke, duplicate-email guard.
- Admin users screen: list + search, invite dialog, role select, activate/
  deactivate, pending invitations, last-admin protection (role demotion and
  deactivation are refused with validation errors).
- Activity screen with log filters, fed by user/invitation events.
- `active` middleware signs out deactivated accounts on their next request.

**Accept:** role matrix tests pass (author 403 on `/admin/users`, editor sees
team but cannot manage, admin manages); invited editor accepts and logs in with
the invited role; last admin cannot be demoted or deactivated; addon permission
`demo:view` is enforced by `can:` middleware on the addon route.
69 tests / 299 assertions, pint (114 files) + tsc + eslint + build green.

**Next: S3 — pages, editor, publishing** (`pages`, `page_revisions`,
`page_slugs`, section registry, three-panel editor, autosave, publish/schedule,
signed preview, slug 301s).

## S3 — Pages, editor, publishing

Split into S3.1 (pages backend + first editor pass) and S3.2 (editor polish:
media picker wiring, drag-to-reorder, section picker modal) to stay inside the
file budget.

**Done (S3.1)**

- `media`, `pages`, `page_revisions`, `page_slugs` migrations; models `Page`,
  `PageRevision`, `PageSlug`, `Media` (pages are soft-deletable, content is a
  JSON column, `version` bumps on every write).
- Section contract: `Cms\Sections\{Field,Section,SectionRegistry,CoreSections}`.
  PHP is the source of truth (fields, defaults, validation rules, editor
  schema); the TS mirror is `resources/js/lib/sections.ts`. Core sections:
  `hero`, `rich-text`, `feature-grid`, `cta`; addons and themes can register
  more through the registry at boot.
- Validation: the registry owns structural rules, `SectionRegistry::validate()`
  re-checks each block against its own section after normalisation — a block
  with an unknown `section` key is **dropped**, not rejected, and missing keys
  are filled from defaults.
- `Cms\Pages\Slugger` (unique slugs, history kept in `page_slugs`, historical
  slugs never reused) and `Cms\Pages\PageRepository` (create/update, revision
  snapshots with a one-minute dedupe, restore-revision that snapshots the
  current state first — forced, so a restore can always be undone, publish,
  unpublish, schedule, duplicate).
- `PagePolicy`: authors edit only their own pages; publish and delete need
  `pages.publish` / `pages.delete` (editors+). Requests: `StorePageRequest`,
  `UpdatePageRequest` (registry-derived rules, section rule failures land on
  `content.{index}.content.{field}` so the editor can scroll to the block).
- `PageController` (index/create/store/edit/update/autosave/publish/unpublish/
  schedule/duplicate/destroy/restore/restore-revision) and
  `PublicPageController` (home, published pages at `/{slug}`, historical slug →
  301, signed six-hour draft preview). Autosave answers JSON, never redirects.
- Preview is a signed route only: the admin page hands out
  `URL::temporarySignedRoute('preview.pages.show', 6h)`; unsigned hits 403.
- The `{slug}` catch-all is the last route in `web.php` and refuses reserved
  first segments, so `/settings/*` keeps working and `POST /register` is still
  a 404 rather than a 405 from the catch-all.
- Frontend: `pages/admin/pages/index.tsx` (filters, status counts, optimistic
  publish toggle, delete with undo, trash view), `pages/admin/pages/edit.tsx`
  (three panels: outline / live canvas / inspector, add–move–hide–remove
  sections, 1.5 s debounced autosave through Inertia v3 `useHttp`, save-state
  indicator, `beforeunload` guard, SEO dialog with snippet preview and length
  meters, revision sheet with restore, schedule dialog), plus
  `section-renderer.tsx`, `field-control.tsx` (text/textarea/richtext/select/
  boolean/url/color/media/repeater) and the public renderer
  (`pages/public/page.tsx`, `not-found.tsx`, `pages/preview/page.tsx`).

**Accept:** 18 feature tests for pages and publishing — CRUD, registry-driven
validation, unknown sections dropped, autosave without redirect, publish /
unpublish, author refused publish, schedule in the future only, duplicate as a
draft copy, soft delete + trash + restore, revision restore with a
"Before restore" snapshot, editor render, public serving, drafts 404, scheduled
pages hidden until their time, 301 on a renamed slug, historical slug never
reused, signed-preview only. Full suite: 88 tests / 430 assertions. pint
(133 files) + tsc + eslint (0 warnings) + build green.

**Next: S3.2 — editor polish**, then S4 media library.

## S4 — Media

Split like S3: S4.1 media storage backend (done), S4.2 HTTP + library UI,
S4.3 picker wired into the editor.

**Done (S4.1)**

- `media_folders` and `media_usages` migrations. Folders are a self-referencing
  tree; `media_usages` is a polymorphic table (`usable_type`, `usable_id`,
  `field`) with a unique key per usage, so re-saving a page can never duplicate
  a row. The `media` table from S3 already carried uuid/disk/path/dimensions.
- `App\Models\MediaFolder` (parent/children/media, `trail()`, `depth()`,
  sibling-unique slugs) and `App\Models\MediaUsage` (media + morphTo usable).
  `Media` gained `folder()`, `usages()`, `thumbnailPath()`, `thumbnailUrl()`,
  `isImage()`, `humanSize()`, `dimensionLabel()`.
- `App\Cms\Media\MediaLibrary` owns every disk write: UUID file names under
  `media/YYYY/MM`, real dimensions from `getimagesize`, one GD thumbnail
  (480 px long edge, JPEG q82) written to `<dir>/thumbs/`, metadata edits that
  never touch bytes, soft delete + restore + purge, folder CRUD that refuses to
  delete a non-empty folder, and a recursive `scan()` of section content that
  finds `/storage/...` references anywhere in the JSON tree.
- Usage bookkeeping is derived state: `Page::saved` / `Page::restored` /
  `Page::deleted` are hooked in `AppServiceProvider`, so editor saves, autosave,
  duplicate and revision restore all rewrite `media_usages` without any caller
  knowing about media. Field paths match the editor's error paths
  (`content.0.content.image`).
- `MediaPolicy`: view/upload for authors, update/delete/move for editors and up;
  folder management follows `media.update`.

**Accept (S4.1):** 11 feature tests — uuid + dimensions + single thumbnail per
image, identical file names stored apart, documents never thumbnailed, alt and
caption edits that leave the file untouched, soft delete/restore/purge,
usage rows created/rewritten/removed as pages change, folder tree slugs and
non-empty folder protection, role matrix. Full suite: 99 tests / 486
assertions; pint clean (139 files).

**Done (S4.2)**

- `MediaController` + routes: `admin.media.index/upload/update/destroy/restore`
  and `admin.media.folders.{store,update,destroy}`. Every action authorizes
  through `MediaPolicy` or the FormRequest, never the route middleware alone.
- `UploadMediaRequest` (max 12 MB, 10 files, JPG/PNG/WebP/GIF/PDF),
  `UpdateMediaRequest` (alt/caption/folder only — replacing bytes is a new
  upload, not an edit) and `MediaFolderRequest` (sibling folders compared by
  slug, a folder can never be moved inside itself).
- Library screen `pages/admin/media/index.tsx`: folder rail with counts, search
  (enter or blur), type/trash filters, grid and list views, drag-and-drop
  uploads with **one progress bar per file** (files are posted one visit each,
  so a rejected file names itself), detail drawer with inline alt/caption
  editing and folder moves, usage list linking straight to the page editor, and
  delete with an Undo toast that warns how many places used the file.
- Usage details ship with the index (eager-loaded `usages.usable`), so opening
  the drawer costs no request and no client-side data fetching.

**Accept (S4.2):** 9 HTTP feature tests — library render for editor and author
with correct `can` flags, three-file multi-upload into a folder (two thumbnails
written), rejection of PHP/oversized/empty uploads, guest redirect and
permission 403, alt editing (author refused), delete-with-usage warning +
restore, usage list on the index, folder create/rename/duplicate-name/
non-empty-delete guard, and search/type/trash filters. Full suite: 108 tests /
624 assertions; pint (144 files), tsc, eslint (0 warnings) and build green;
`/admin/media` renders 200 for admin, editor and author.

**Next: S4.3 — `MediaPicker`** shared by the editor's `media` fields, then
S5 themes and the public site.
