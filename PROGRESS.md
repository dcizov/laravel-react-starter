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

**Done (S4.3)**

- `admin.media.browse` JSON endpoint (newest 60 matches, `q` + `folder`
  filters, folders and `can.upload` in the payload) — the picker reads the
  library without a page visit, so opening it inside the editor never reloads
  or discards the page being edited. Guests get 401, users without `media.view`
  403.
- `resources/js/components/media/media-picker.tsx`: `MediaPicker` dialog
  (search, folder filter, thumbnail grid, current selection marked, skeletons
  while loading) plus `MediaField`, the editor control that shows a preview with
  Replace/Remove and stores the file's public URL — the value the renderer
  already uses and the usage scanner already matches on.
- `field-control.tsx`'s `media` case is now that control instead of a free-text
  input, so every section with an image field (hero today, themes and addons
  later) gets the picker for free.

**Accept (S4.3):** upload 3 files → pick one into a hero section → the value
round-trips as a `/storage/...` URL and a `media_usages` row appears → alt edit
persists on the file → deleting the used image warns and offers undo. Browse
endpoint covered by 2 feature tests (payload, filters, protection). Full suite:
110 tests / 635 assertions; pint (144 files), tsc, eslint (0 warnings) and build
green; browse endpoint returns 200 for editor and author.

## S5 — Themes & public site

Split into S5.1 (theme lifecycle + appearance screen, done) and S5.2 (theme
layouts A/B, themed public site, sitemap/robots/404/preview banner).

**Done (S5.1)**

- Two themes on disk, each a folder with `theme.json` + a provider:
  `app/Themes/Aperture` (editorial default, registers the `stat-band` section)
  and `app/Themes/Meridian` (token variant: teal accent, tight radius,
  condensed headings, reuses every component). `theme.json` now carries
  `components` (`page`, `not_found`) so a theme declares which Inertia
  component renders each public route.
- `App\Cms\Themes\ThemeManager`: lists installed rows plus folders found on
  disk, activates by handle (installing the row if needed), refuses themes whose
  version constraints fail, keeps exactly one active row, exposes merged tokens
  (accent/radius/fonts/weight/density with defaults), and resolves the public
  component — falling back to `public/page` when no theme is active or the
  theme is in `error` state after Safe Mode caught its provider.
- **Fix found by S5:** `SectionRegistry` was resolved fresh per injection, so a
  theme provider's `add()` landed in a throwaway instance and `add()` also set
  the `loaded` flag, which would have hidden the core sections. It is now a
  singleton bound in `CoreServiceProvider`, and `add()` no longer flips
  `loaded`. `stat-band` proves the whole path (provider → registry → editor
  schema → validator rules).
- `/admin/appearance` (`AppearanceController` + `pages/admin/appearance/index.tsx`):
  theme cards with token swatches, live/error badges, an active-theme summary
  row, and **optimistic activation** via `router.optimistic(...)` with a
  "Change reverted" toast when the server refuses. Authorized by the
  `themes.view` / `themes.activate` gates (author 403).

**Accept (S5.1):** 9 feature tests — both themes discovered with their tokens,
activation leaves exactly one active, tokens/components resolve for the active
theme, core fallback when none is active, unknown handle refused, theme section
merged on top of the core set, appearance screen render + permission flags, HTTP
activation + activity row, author 403 and unknown-handle validation error. Full
suite: 119 tests / 683 assertions; pint (149 files), tsc, eslint (0 warnings) and
build green; `lattice:install` registers both themes and `/admin/appearance`
renders 200 for admin/editor, 403 for author.

**Done (S5.2)**

- `menu_items` table + `App\Models\MenuItem` (page- or URL-targeted, nested via
  `parent_id`, `href()` resolves at read time and degrades to `/` when the target
  page is a draft, scheduled or deleted — a menu can never link to a 404).
- `App\Cms\Menus\MenuRepository`: ordered trees per menu (`main`, `footer`),
  built from one query, and safe to call before the tables exist.
- `PublicPageController` now renders **the component the active theme declares**
  (`themes/{handle}/page`) and shares one `shell()` payload with the page, the
  404 and the preview: site identity (`config('lattice.site')`), theme
  handle/name/tokens/degraded and both menus. Unknown slug → themed 404 with
  chrome, still 404; signed previews unchanged and still `noindex`.
- `SitemapController`: `/sitemap.xml` (published, past, indexable pages only,
  home at `/`) and `/robots.txt` (blocks `/admin`, `/preview`, `/settings`,
  `/invitations`, points at the sitemap). Both registered above the catch-all.
- `MenuSeeder` (main + footer, page-targeted when the page exists) wired into
  `DatabaseSeeder`, so a fresh install has working chrome before a theme exists.

**Accept (S5.2):** 8 new feature tests (9 total in the file) — page render with
site + menus + tokens, menu items resolving to pages and degrading unpublished
targets, nested children, 404 with chrome, errored-theme degradation, sitemap
excluding noindex/draft/scheduled pages, robots rules, signed-preview gating.
Full suite: 127 tests / 750 assertions; pint (155 files), tsc, eslint
(0 warnings) and build green; `/sitemap.xml`, `/robots.txt` and `/` all 200 in
the running preview.

**Done (S5.3)**

- `components/themes/theme-shell.tsx`: the public chrome shared by the core
  renderer and both themes — skip link, sticky header with the `main` menu (last
  item becomes the accent CTA), footer with the `footer` menu and site identity.
  It publishes the theme tokens as CSS custom properties
  (`--theme-accent`, `--theme-radius`, `--radius`) and sets `data-theme`, so the
  markup reads tokens and never sneaks in a theme name. `ThemeBand` gives the
  two rhythms (wide editorial / compact).
- `pages/themes/aperture/{page,not-found}.tsx` — wide editorial rhythm,
  alternating band tone per section, `<Head>` SEO incl. Open Graph, themed 404.
- `pages/themes/meridian/{page,not-found}.tsx` — same components, compact
  rhythm, mono display type, continuous canvas: proof that a theme is a token
  layer rather than a fork of the renderer.
- Core `public/page.tsx` and `public/not-found.tsx` now use the same shell, so
  Safe Mode fallback changes nothing but the component name.
- `preview/page.tsx`: banner now names the active theme and states that the URL
  is signed and expires, then renders the draft in the theme's tokens.
- `section-renderer.tsx` gained the `stat-band` renderer for the section the
  Aperture provider registers — the full path theme provider → registry →
  editor schema → canvas → public site is now exercised end to end.

**Accept (S5.3):** switching themes changes the live site (verified against the
running preview: `/` renders `themes/aperture/page`, then `themes/meridian/page`
after activation, then back); an errored theme falls back to the core component;
themed 404; the theme's section shows up in the editor's schema. 2 new feature
tests. Full suite: 129 tests / 796 assertions; pint (155 files), tsc, eslint
(0 warnings) and build green.

## S6 — Addons: UI + PostCraft

Split into S6.1 (addons screen, done) and S6.2 (PostCraft addon).

**Done (S6.1)**

- `App\Cms\Addons\AddonCatalog`: read model for the screen. Cards come from
  installed rows **plus** folders found on disk, in three states —
  `active`/`inactive` (row decides), `discovered` (folder, never installed) and
  `blocked` (folder whose `requires` cannot be met, with the exact reason kept
  in `error`). Card includes permissions, nav entries, sections, resources,
  `can_uninstall` (only addons inside `app/Addons` may have files deleted) and a
  `urls` object so the client never builds addon URLs.
- `AddonController` (`index`, `install`, `activate`, `deactivate`, `uninstall`)
  delegates every mutation to `AddonManager`, so the invariants stay in one
  place: constraints checked before activation, migrations rolled back when an
  activation fails, data kept on deactivate, uninstall only touching that
  addon's own migrations and folder. Uninstall requires the handle typed back
  (`in:<handle>` validation) and takes explicit `delete_data` / `delete_files`
  flags.
- Authorization: `addons.view` to look, `addons.manage` to change — Editor gets
  a read-only screen, Author gets 403.
- `app/Addons/Shopper/` ships on disk with `requires: {php: ^8.5,
  lattice: ^2.0, addons: [Payments]}`: the catalog shows it as *Incompatible*
  with the readable reason and installing it is refused before anything changes.
- Screen `pages/admin/addons/index.tsx`: status cards, optimistic
  activate/deactivate with a "Change reverted" toast, details sheet (requires,
  permissions, nav, sections, resources, timestamps), and an uninstall dialog
  with typed confirmation plus keep/delete data + delete-files switches.

**Accept (S6.1):** 8 feature tests — list with the blocked addon and correct
counts, exact incompatibility reason, HTTP install refused with a readable
error, activate/deactivate keeping the row and stamping `activated_at`,
editor read-only (403 on writes) and author 403 on the screen,
typed-handle confirmation enforced, uninstall keeping the folder when asked,
unknown handle rejected. Full suite: 137 tests / 854 assertions; pint
(159 files), tsc, eslint (0 warnings) and build green; `/admin/addons` renders
200 for admin/editor and 403 for author.

**Done (S6.2)**

- `app/Addons/PostCraft/`: `addon.json` (permissions `posts.view|create|update|
  delete|publish`, nav entry under *Content*, section `blog-teaser`), one
  migration for `categories`, `tags`, `posts`, `post_tag` (FKs to `media` and
  `users`), `Models/{Post,Category,Tag}` with collision-safe slugs,
  `Activator` (grants the post abilities to Editor and Author; idempotent, so a
  re-activation after a late role seed still works), `PostCraftServiceProvider`
  (admin + public routes, views, section) and `routes/{admin,public}.php`.
- Admin: `PostController` (index with search/status filters, create, store,
  edit, update, publish, unpublish, soft delete) and `TaxonomyController`
  (categories and tags, create/rename/delete) — explicit routes, each action
  authorized by a `posts.*` permission and validated inline; changes are
  written to the activity log. Screens: `pages/posts/{index,edit,taxonomy}.tsx`
  with a plain-text body editor (`## ` heading, `> ` quote, blank line =
  paragraph) and a live word/reading-time readout.
- Public: `BlogController` renders through the **active theme's** chrome and
  tokens (`blog/index`, `blog/show`), paginates 9 posts, shows only live
  (`status = published` and `published_at <= now()`) posts, and serves
  `/blog/rss.xml` registered above `blog/{slug}`.
- Core hook: `App\Cms\Sections\Section` takes an optional `data` closure;
  `PublicPageController` resolves it per block into `section_data`, which
  `section-renderer.tsx` passes to the `BlogTeaser` case. So a page can drop in
  a "Blog teaser" section and PostCraft fills it — the core still knows nothing
  about posts.
- `App\Cms\Addons\Middleware\EnsureAddonActive` guards every PostCraft route
  (404 unless the addon row is active), so a cached route table or a
  long-lived worker can never serve a deactivated addon.

**Accept (S6.2):** 9 feature tests — activation migrates and grants roles;
`/blog`, `/blog/{slug}` and the RSS feed render; drafts and future-dated posts
stay off the public site; full admin CRUD over HTTP; authors write but cannot
publish; taxonomy CRUD; **deactivation removes the nav entry and 404s both
admin and public routes while every row remains**; **re-activation restores
routes, navigation and content**; the blog-teaser section resolves live data.
The tests boot a second application (`refreshApplication`) so the addon's
routes register in the order a real request sees them — `tests/Pest.php` now
runs `Feature/Addons` on `DatabaseMigrations` for that reason.
Full suite: **146 tests / 947 assertions**; pint (173 files), `tsc`, eslint
(0 warnings) and `npm run build` green. Smoke: `/blog`, `/blog/{slug}`,
`/blog/rss.xml`, `/admin/posts` and `/admin/posts/taxonomy` answer 200 for
admin/editor/author (per-role abilities enforced in the controllers).

**Next: S7 — dashboard, settings and activity.**
