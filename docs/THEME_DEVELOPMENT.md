# Theme development

A theme changes the public site's tokens and chrome. It never changes the
database, the admin, or another theme. Lattice ships two: **Aperture** (editorial,
wide) and **Meridian** (token variant: tighter radius, condensed headings, teal).

## 1. What a theme is

```
app/Themes/Meridian/
  theme.json               manifest: tokens + which Inertia components render
  MeridianServiceProvider.php   registers sections (optional)
resources/js/pages/themes/meridian/
  page.tsx                 the page renderer
  not-found.tsx            the 404 renderer
```

`theme.json`:

```json
{
    "handle": "meridian",
    "name": "Meridian",
    "version": "1.0.0",
    "description": "Token variant of Aperture.",
    "provider": "App\\Themes\\Meridian\\MeridianServiceProvider",
    "requires": { "lattice": "^0.1" },
    "tokens": {
        "accent": "oklch(0.55 0.12 190)",
        "radius": "0.125rem",
        "font": "Inter",
        "heading_font": "Inter Tight",
        "heading_weight": "800",
        "density": "compact"
    },
    "components": {
        "page": "themes/meridian/page",
        "not_found": "themes/meridian/not-found"
    }
}
```

`handle` is lowercase here (themes, unlike addons, are file-like). `components`
maps two roles — `page` and `not_found` — to Inertia component names under
`resources/js/pages`. Anything missing falls back to the core renderer
(`public/page`, `public/not-found`), so a half-finished theme degrades instead of
white-screening.

## 2. Tokens

| Token            | Used for                                            |
| ---------------- | --------------------------------------------------- |
| `accent`         | buttons, links, the mark, focus accents             |
| `radius`         | every rounded corner (`--theme-radius`, `--radius`) |
| `font`           | body font-family                                    |
| `heading_font`   | display headings                                    |
| `heading_weight` | display weight                                      |
| `density`        | `comfortable` or `compact` spacing                  |

Tokens are sent with every public payload (`theme.tokens`) and applied by
`components/themes/theme-shell.tsx` as CSS custom properties on the wrapper. A
theme that only changes tokens — like Meridian — ships **no new JSX at all**; it
maps `components` to the same files and puts its character in `tokens`.

The design system itself (OKLCH variables, dark mode via `.dark`, bundled Inter)
belongs to the core. A theme must not redefine `--primary` or import a font from
a CDN.

## 3. Switching themes

```bash
php artisan theme:activate meridian
```

`ThemeManager` writes `themes.is_active`, flushes the theme cache and reloads the
provider. The next request renders the new components. Activation checks the
manifest's `requires` first and never touches content.

## 4. Registration and safe mode

A theme provider boots exactly like an addon's: only when the row is active, and
inside `SafeMode`. A provider that throws marks the theme `degraded` — the site
keeps serving with core tokens and a `degraded` flag in the payload.

## 5. Sections

Sections are the page builder's vocabulary: an ordered list of blocks
(`{ id, section, enabled, content }`) stored in `pages.content`.

A theme may **add** sections (Aperture ships `stat-band`) but cannot remove the
core ones (`hero`, `rich-text`, `feature-grid`, `cta`) — a page must render the
same way under any theme.

```php
public function boot(): void
{
    $this->app->make(SectionRegistry::class)->add(
        Section::make('stat-band', 'Stat band', [
            Field::text('heading', 'Heading', ['required' => true]),
            Field::textarea('intro', 'Intro'),
            Field::repeater('stats', 'Stats', [
                Field::text('value', 'Value', ['required' => true]),
                Field::text('label', 'Label', ['required' => true]),
            ]),
        ], [
            'description' => 'A row of figures with an editorial intro.',
            'icon' => 'bar-chart-3',
        ]),
    );
}
```

`Section::make($handle, $label, $fields, $options)` — options are `description`,
`icon`, `theme` (set when the section ships inside a theme rather than the
core) and `data` (a closure the core resolves per block; PostCraft uses it to
fill its blog teaser from live posts).

### Fields

| Type                                  | Editor control   | Notes                                           |
| ------------------------------------- | ---------------- | ----------------------------------------------- |
| `text`, `textarea`, `richtext`, `url` | input / textarea | `rules` are appended to server validation       |
| `number`                              | number input     | `default`, `min`, `max` via `rules`             |
| `boolean`                             | switch           |                                                 |
| `select`                              | select           | `choices` => `[value => label]`                 |
| `media`                               | media picker     | stores the media id; the shell resolves the URL |
| `color`                               | colour input     | OKLCH or hex                                    |
| `repeater`                            | repeatable group | one nesting level                               |

Each field can declare `required`, `default`, `rules` and a `hint`. The inspector
is generated from this schema — there is no hand-written form per section
anywhere in the client.

### Rendering a section

The React side is `resources/js/components/sections/section-renderer.tsx`: one
case per section handle. A theme that adds `stat-band` renders it there (or
reuses an existing case); the theme's `page.tsx` only supplies chrome, rhythm and
sizing.

## 6. The page contract

Every theme page receives the same props — nothing is invented per theme:

```ts
type ThemePageProps = {
    site: {
        name: string;
        tagline: string;
        description: string;
        home_url: string;
        year: number;
    };
    menus: Record<string, MenuLink[]>; // from menu_items, never hardcoded
    theme: {
        handle: string;
        name: string;
        tokens: Record<string, string>;
        degraded: boolean;
    };
};
```

Plus, for a page: `page`, `sections` (the schema), `section_data` (resolved data
per block id). Use `ThemeShell` and you inherit the header, footer, skip link,
menus and tokens for free:

```tsx
<ThemeShell site={site} menus={menus} theme={theme} variant="wide">
    <SectionList
        sections={page.content}
        schema={sections}
        data={section_data}
    />
</ThemeShell>
```

## 7. Rules a theme must keep

- **Menus come from the database.** Never hardcode navigation in a theme.
- **Content comes from props.** No client-side fetching, no business logic in
  JSX, no duplicated server state in `useState`.
- **Unknown sections must not crash the page.** The renderer skips what it does
  not know and the page still renders.
- **The 404 page is a component role too** — map `not_found` or inherit the core
  one.
- **Accessibility is not optional**: keep the skip link, one `h1` per page,
  visible focus rings, and `prefers-reduced-motion` respected.

## Checklist

- [ ] `theme.json` valid; `requires.lattice` honest
- [ ] `components.page` and `components.not_found` exist and are built
- [ ] tokens only — no CDN fonts, no redefined core variables
- [ ] sections registered with fields, rules and defaults
- [ ] renderer updated for any new section handle
- [ ] public page, blog and 404 checked in light and dark mode
- [ ] `php artisan test`, `pint --test`, `tsc`, `eslint`, `npm run build` green
