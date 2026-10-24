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

## S7 — Dashboard, settings, activity

Split into S7.1 (settings), S7.2 (dashboard + notifications) and S7.3 (activity
polish) — the step is far larger than twelve files.

**Done (S7.1)**

- `settings` table (key unique, group, type, json value, `is_public`) plus
  `App\Models\Setting`.
- `App\Cms\Settings\SettingSchema` declares five groups — General, Branding,
  SEO, Content, Mail — with typed fields (`string`, `text`, `integer`,
  `boolean`, `select`, `email`, `secret`, `media`, `color`), defaults, hints,
  options, validation and which values are public. Adding a setting is a data
  change: no controller, no form, no migration.
- `App\Cms\Settings\SettingRepository` is the only reader/writer: typed casts,
  one row per key, a single `PATCH` that saves whatever keys it receives (so a
  lone switch and a whole form share an endpoint), encrypted `secret` values,
  a cached `publicValues()` payload, and `applyToConfig()` which copies the
  saved identity over `config('lattice.site.*')` at boot. That is why the
  public site picks up a new name/logo without any controller knowing about
  settings.
- `SettingsController` + `UpdateSettingsRequest`: rules generated from the
  schema, `settings.view` to look and `settings.update` to write; a blank
  secret keeps the stored one. Nav entry now carries `settings.view`, so
  authors no longer see a screen they cannot open.
- `admin/settings/index.tsx`: group tabs, schema-driven fields (switch, select,
  textarea, colour, media picker, masked secret with a "stored" placeholder),
  a dirty-state save bar with Discard/Save and a processing label, and
  optimistic boolean switches (`router.optimistic`, rollback toast on refusal).
  `ThemeShell` renders the saved logo in the public header.

**Accept (S7.1):** 9 feature tests — schema-driven screen and redirect from
`/admin/settings`, editor read-only screen and author 403 (index included),
general save persists and the public page reports the new name, a logo save
reaches `settings.public.logo` in the public payload, per-type validation
(integer, select option, email, required), single-switch partial save, secret
encrypted at rest and never sent to the browser while a blank save keeps it,
unknown group 404, and the change lands in the activity log.
Full suite: **155 tests / 1037 assertions**; pint (180 files), tsc, eslint and
build green. Smoke: `/admin/settings` 302 → general for admin/editor, 403 for
author; saving a name in the live DB changed the rendered public header and
removing it restored the config default.

**Done (S7.2)**

- `page_views` table (+ `App\Models\PageView`) and
  `App\Cms\Analytics\TrafficRepository`: one grouped query covers twice the
  window, so the series, the total and the comparison against the previous
  fortnight all come from the same statement. Empty days are filled in PHP.
- `notifications` table (Laravel's database notifications) + `Inbox` read model
  and `NotificationController` (`read`, `read-all`), scoped through the user's
  own relation so one user can never touch another's rows.
- `DashboardController` replaces the placeholder: four KPIs (published pages
  with the draft count, page views with the trend, media, team), a 14-day
  traffic series, the six latest activity rows, five drafts and addon health.
  The two short lists join `users` instead of eager-loading a relation, and
  ability flags come from the same `AbilityMap` the layout already built.
- Query budget work (this is the acceptance criterion): `AbilityMap` now
  answers from two queries (permission list + one union of role and direct
  grants) instead of five gate calls per permission, it is memoised and bound
  as a scoped singleton, and `Navigation` filters from that map instead of one
  gate call per sidebar item. `/admin` went from 17 queries to **12**.
- `resources/js/pages/dashboard.tsx`: KPI cards, an inline SVG area chart (no
  chart library — fewer than 15 points, and a `<table>` fallback for screen
  readers), addon health with the failure message inline, drafts and recent
  activity, each with its own empty state.
- `components/notification-bell.tsx`: unread badge, deferred rows (skeleton
  while they load), per-row mark-as-read that navigates, "mark all read", and
  an "all caught up" empty state. It sits in `admin-top-bar.tsx`, which also
  gained a permission-gated "New page" button instead of the disabled one.

**Accept (S7.2):** 9 feature tests — KPIs/series/lists from real rows, the two
empty states on a brand new install, addon health including an `error` row,
the author's reduced ability flags, **query budget asserted (`≤ 12`) with 25
pages and 20 days of views seeded**, notifications deferred from the first
paint, one-read and read-all endpoints, and cross-user isolation.
Full suite: **164 tests / 1142 assertions**; pint (188 files), tsc, eslint and
build green. The dev database carries eight weeks of seeded traffic and two
bell rows, so the preview shows a real chart.

**Done (S7.3)**

- `ActivityController` now filters on log, event, causer, free text and a date
  range (`from`/`to`), ignores malformed dates instead of erroring, and answers
  in one query: the causer name comes from a join, not an eager load.
- Rows come back **grouped by day** — `Today`, `Yesterday`, then `12 October` —
  so the client never re-derives days from ISO strings. The payload carries the
  paginator links, `total/from/to`, all filter values, an `active` flag and the
  option lists (logs, events, people).
- `admin/activity/index.tsx` rebuilt around a filter card (search, log, event,
  person, from/to, Apply), a skeleton while a filtered request is in flight, a
  paginated `Previous / Page n / Next` footer, and **two** empty states: "nothing
  has happened yet" versus "no activity matches these filters" with a Clear
  filters action.

**Accept (S7.3):** 7 feature tests — day grouping and labels, every filter
(log, event, causer, search, from, to), malformed dates ignored, the two empty
states distinguished by the `active` flag, 30-per-page pagination, author read
access and the login wall.
Full suite: **171 tests / 1278 assertions**; pint (189 files), tsc, eslint and
build green. Smoke: `/admin/activity`, a filtered query and a malformed date all
answer 200 for admin and author.

## S8 — Seed, polish, docs, QA

Split into S8.1 (demo data), S8.2 (docs) and S8.3 (polish + QA).

**Done (S8.1)**

- `database/seeders/DemoSeeder.php`: the whole demo site, idempotent (every
  record matched on its natural key) and dated relative to `now()`: eight pages
  (five published, one scheduled, one draft, one trashed — real studio copy, two
  revisions each), eight media items, PostCraft with three categories, four tags
  and six posts spread over five months, populated settings in all five groups,
  25 activity rows, eight weeks of page views, `aperture` active, PostCraft
  active and `Shopper` left blocked on disk.
- `database/seeders/Demo/PlaceholderImages.php`: the fixture image script —
  GD-drawn duotone abstracts (1600×1067) from a deterministic seed, so the
  repository holds no binary fixtures and the demo still looks designed.
- `lattice:reset-demo {--force}` drops, migrates, seeds and regenerates the
  registries; `lattice:install --demo` now seeds `DemoSeeder` instead of the
  bare `DatabaseSeeder`.
- Deviation, recorded: the spec's §G mentions a `Redirects` addon with four
  rows; that addon was never part of S6's scope, so the on-disk set stays
  `Demo`, `PostCraft` and the incompatible `Shopper`.

**Accept (S8.1):** 3 feature tests — the seeded site matches §G (8 pages split
5/1/1/1, 8 media, 6 posts, 3 categories, 25 activity rows, >500 page views,
menus pointing at page ids), settings drive the public site (name, logo,
`page.slug = home`), and a second run changes nothing.
Full suite: **174 tests / 1314 assertions**; pint (194 files) green.
`lattice:reset-demo --force` on the dev database: every public route
(`/`, `/services`, `/about`, `/contact`, `/imprint`, `/blog`,
`/blog/{slug}`, `/sitemap.xml`, `/robots.txt`) answers 200 and `lattice:doctor`
reports **no problems**.

### S8.2 — Documentation (and the two missing commands)

**Done (S8.2)**

- `README.md` — stack table, quickstart (`composer install` → `.env` →
  `npm run build` → `lattice:install --demo` → `serve`), demo credentials
  (`admin|editor|author@lattice.test`, password `password`, one pending
  invitation), everyday commands, gate commands, "where things live", doc
  links and troubleshooting.
- `docs/ARCHITECTURE.md` — request lifecycle, the registries, section
  contract, permission map, storage layout and the rules the core keeps.
- `docs/ADDON_DEVELOPMENT.md` — manifest keys, folder layout, lifecycle,
  routes/middleware, migrations, settings, sections and a walkthrough.
- `docs/THEME_DEVELOPMENT.md` — manifest, tokens, the section → component
  contract, `ThemePageProps`, menus and a checklist.

Two commands the docs (and `01-spec.md` §I) promised did not exist yet, so they
were written with this step instead of documenting them as missing:

- `theme:activate {handle}` — goes through `ThemeManager::activate()`, so
  requirement checks, the cache flush and the provider reload are the same code
  path the Appearance screen uses; a bad handle exits non-zero with the reason.
- `pages:publish-scheduled` — publishes every page whose `scheduled_at` has
  passed, idempotent when nothing is due, and wired into `routes/console.php`
  as `Schedule::command(...)->everyMinute()->withoutOverlapping()`.

**Accept (S8.2):** `tests/Feature/Cms/CommandsTest.php` (5 tests) covers
activation, the refusal path, the due/not-due split of the publisher and the
schedule entry. Full suite: **179 tests / 1324 assertions**; pint, `tsc
--noEmit`, eslint and `npm run build` all clean.

### S8.3 — UI audit and QA

**Audit method.** Every admin screen and every list was read against four
questions: does it have a loading state, an empty state and an error path; does
every destructive action ask first; does it survive dark mode; can it be driven
from the keyboard. What follows is only what the audit *changed* — everything
else already held.

| Screen | Loading | Empty | Error | Confirm | Notes |
|---|---|---|---|---|---|
| Dashboard | deferred notifications paint as skeletons | empty states on drafts and activity | toast per action | — | |
| Pages list | row skeletons | four variants (no pages / no results / empty trash) | toast + retry | trash is reversible and offers Undo | |
| Page editor | — | — | inline alert | — | block list decides Enter *and* Space |
| Media library | grid + table skeletons | empty library, empty folder | toast, keep selection | delete dialog names the usage count | |
| Users | — | empty state | toast | dialog with password | |
| Addons | — | empty catalog | error status per addon | uninstall requires typing the handle | |
| Activity | row skeletons | empty + filtered-empty | toast | — | |
| Settings | — | — | toast echoing the first validation error | — | booleans save optimistically |
| Posts list / editor | — | empty + filtered-empty | toast | **was missing** → dialog now | |
| Taxonomy | — | "nothing here yet" | toast | **was missing** → dialog now | |

**Changed (5 files)**

- `resources/js/components/confirm-dialog.tsx` — one confirmation for
  destructive actions; *Cancel* is the first tab stop so an Enter on an opened
  dialog can never destroy anything.
- `resources/js/pages/posts/index.tsx`, `posts/edit.tsx`,
  `posts/taxonomy.tsx` — the three delete paths that fired immediately. The
  editor's `window.confirm` is gone; a term deletion now says how many posts
  used it.
- `resources/js/pages/admin/media/index.tsx` — cards answer Space as well as
  Enter, and the pagination gap-key lint hit is fixed properly instead of by an
  unused directive.
- Focus and naming: `focus-visible` rings on the two `role="button"` surfaces
  (page blocks, media cards), `aria-label` on the icon-only header buttons, and
  the auth screens' raw `text-green-600` / input errors replaced by the
  `status-published` / `status-error` tokens so dark mode keeps its contrast.

**QA run.** Fresh database via `lattice:reset-demo --force` (migrate + seed +
registries), then the README walkthrough end to end:

| Check | Result |
|---|---|
| `/`, `/services`, `/about`, `/contact`, `/imprint` | 200 |
| `/blog`, `/blog/why-we-still-draw-with-a-pencil`, `/sitemap.xml`, `/robots.txt` | 200 |
| `/login` (guests) | 200, `/admin` → 302 to it, `/admin/login` 404 |
| `/dashboard` (not a Lattice route) | 404 |
| `php artisan lattice:doctor` | *No problems found* (core tables, addons, theme, storage link) |
| `php artisan theme:activate meridian` → back to `aperture` | both announce the new theme, content untouched |
| `php artisan schedule:list` | `pages:publish-scheduled` every minute |
| Gates | pint clean · `tsc --noEmit` clean · eslint 0 warnings · `npm run build` ok · **179 tests / 1324 assertions** |

**Deviation, recorded:** the S8 scope asks for screenshots in the README. The
build sandbox has no browser (no Chromium/WebKit binary and the Playwright CDN
is unreachable), so the README carries the walkthrough as text and tables
instead. Screenshots can be dropped into `docs/` later without touching prose.

**Accept (S8.3):** a fresh clone installs, seeds and walks the README checklist
without a surprise; every list has its three states; every destructive action
asks first; the whole admin is token-driven, so dark mode needs no second
stylesheet.

### S8 close-out

Lattice is complete through the scope of `02-steps.md`. A fresh clone gets:

```
composer install && cp .env.example .env && php artisan key:generate
npm install && npm run build
php artisan lattice:install --demo      # migrate + seed + storage:link + discover
php artisan serve
```

and lands on a seeded Northwind Studio site (`/`) with the admin at `/admin`
(`admin@lattice.test` / `password`) — eight pages in five shapes, a six-post
blog with categories and tags, eight generated images, eight weeks of traffic,
five settings groups, a full activity log, two themes (`aperture` live,
`meridian` installed) and one addon (`PostCraft`) doing real work: its routes,
navigation and sections appear when active and vanish, without losing a row,
when it is not. `Shopper` stays on disk as the incompatible case.

Final state: **179 tests / 1324 assertions**, pint (196 files), `tsc --noEmit`,
eslint (0 warnings), `npm run build` and `lattice:doctor` all green.

Known deviations, all recorded above: no `Redirects` addon (§G mentions one that
S6 never scoped), no README screenshots (no browser in the build sandbox), and
`theme:activate` / `pages:publish-scheduled` were written in S8.2 rather than in
the step that introduced their callers.

### S8.4 — Install path fix (reported from a real clone)

`composer setup` failed on a fresh clone with

```
SQLSTATE[08006] [7] could not translate host name "pgsql" to address
```

The skeleton still carried the upstream starter's Postgres defaults:
`.env.example` said `DB_CONNECTION=pgsql` / `DB_HOST=pgsql`, `compose.yaml`
started a `pgsql` container, and `composer setup` ran a plain `migrate` — while
`composer.json` already touched `database/database.sqlite` in
`post-create-project-cmd`, and the whole of Lattice is SQLite. Three things
disagreed with each other and the README described a fourth.

**Fixed**

- `.env.example` — `DB_CONNECTION=sqlite` (path defaults to
  `database/database.sqlite`), the Postgres/MySQL block kept commented for
  anyone who wants it, `APP_NAME=Lattice`, and `MAIL_MAILER=log` so a fresh
  clone needs no mail server (Sail users can switch to `smtp`/`mailpit`).
- `composer.json` — `setup` now creates the SQLite file and runs
  `lattice:install --force` instead of `migrate`, so addons, themes, the storage
  link and the frontend registries are all part of "setup". New `setup:demo`
  script adds `--demo`.
- `compose.yaml` — the unused `pgsql` service, its health check, the
  `depends_on` entry and the `sail-pgsql` volume are gone; `mailpit` stays.
- `README.md` — the quickstart is `composer setup` + `composer setup:demo` +
  `php artisan serve`, with the by-hand steps folded into a `<details>` block
  and a note for people whose `.env` predates the switch.

**Verified:** a fresh SQLite file (`touch /tmp/fresh.sqlite`,
`DB_CONNECTION=sqlite DB_DATABASE=/tmp/fresh.sqlite php artisan lattice:install
--demo --force`) installs, seeds and discovers end to end in ~5 s; the full
suite is unchanged at **179 tests / 1324 assertions**.
