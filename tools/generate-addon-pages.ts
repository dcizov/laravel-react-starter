// Writes the addon page artefacts in resources/js/generated from each addon's addon.json (provides.pages).
//
//   npm run addons:pages              write the artefacts
//   npm run addons:pages -- --check   exit 1 if the committed artefacts are stale, and write nothing
//
// The PHP validator (App\Addons\Manifest\ManifestValidator) stays the authority on what a manifest may contain. This
// tool applies the same page rules so the frontend build can run without PHP, and refuses to write when a declared
// page is broken. Undeclared page files are reported as warnings, as AddonCompiler does.

import {
    mkdirSync,
    readFileSync,
    readdirSync,
    realpathSync,
    statSync,
    writeFileSync,
    existsSync,
} from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PAGE_ROOT = 'resources/js/pages';
export const LAYOUTS = ['public', 'app'] as const;
export const GENERATED_DIR = 'resources/js/generated';
export const ADDONS_DIR = 'addons';

const PAGE_PATTERN = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;
const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;

export type Layout = (typeof LAYOUTS)[number];

export interface AddonPage {
    addon: string;
    page: string;
    layout: Layout;
    /** Path from the repository root, for example addons/newsletter/resources/js/pages/subscribe.tsx. */
    file: string;
}

export interface Collected {
    pages: AddonPage[];
    errors: string[];
    warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function listTsxFiles(root: string, relative = ''): string[] {
    const folder = join(root, relative);
    const found: string[] = [];

    for (const entry of readdirSync(folder).sort()) {
        const next = relative === '' ? entry : `${relative}/${entry}`;

        if (statSync(join(root, next)).isDirectory()) {
            found.push(...listTsxFiles(root, next));
        } else if (entry.endsWith('.tsx')) {
            found.push(next.slice(0, -'.tsx'.length));
        }
    }

    return found;
}

/**
 * Reads every addon folder under <repoRoot>/addons. An addon that cannot be read is an error, not skipped, so a
 * broken manifest cannot leave its pages out of the build silently. Paths in the result are relative to repoRoot.
 */
export function collectAddonPages(repoRoot: string): Collected {
    const pages: AddonPage[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const addonsRoot = join(repoRoot, ADDONS_DIR);

    if (!existsSync(addonsRoot)) {
        return { pages, errors, warnings };
    }

    for (const folder of readdirSync(addonsRoot).sort()) {
        const dir = join(addonsRoot, folder);

        if (
            !statSync(dir).isDirectory() ||
            !existsSync(join(dir, 'addon.json'))
        ) {
            continue;
        }

        const rel = `${ADDONS_DIR}/${folder}`;
        const manifestPath = `${rel}/addon.json`;
        let data: unknown;

        try {
            data = JSON.parse(readFileSync(join(dir, 'addon.json'), 'utf8'));
        } catch (error) {
            errors.push(
                `${manifestPath} is not valid JSON: ${(error as Error).message}`,
            );
            continue;
        }

        if (
            !isRecord(data) ||
            typeof data.slug !== 'string' ||
            !SLUG_PATTERN.test(data.slug)
        ) {
            errors.push(`${manifestPath}: "slug" must be a lowercase slug.`);
            continue;
        }

        const slug = data.slug;

        if (slug !== folder) {
            errors.push(
                `${manifestPath}: the slug "${slug}" must match the folder name "${folder}".`,
            );
            continue;
        }

        const provides = isRecord(data.provides) ? data.provides : {};
        const declaredList = provides.pages ?? [];

        if (!Array.isArray(declaredList)) {
            errors.push(
                `${manifestPath}: "provides.pages" must be a list of {"page", "layout"} objects.`,
            );
            continue;
        }

        const pageRoot = join(dir, PAGE_ROOT);
        const realRoot = existsSync(pageRoot) ? realpathSync(pageRoot) : null;
        const declared: string[] = [];

        declaredList.forEach((entry: unknown, index: number) => {
            const where = `${manifestPath}: provides.pages[${index}]`;

            if (
                !isRecord(entry) ||
                Object.keys(entry).some(
                    (key) => key !== 'page' && key !== 'layout',
                )
            ) {
                errors.push(
                    `${where} must have exactly a "page" and a "layout".`,
                );
                return;
            }

            const { page, layout } = entry;

            if (typeof page !== 'string' || !PAGE_PATTERN.test(page)) {
                errors.push(
                    `${where}.page must be a page name without an extension, such as "subscribe".`,
                );
                return;
            }

            if (
                typeof layout !== 'string' ||
                !(LAYOUTS as readonly string[]).includes(layout)
            ) {
                errors.push(`${where}.layout must be "public" or "app".`);
            }

            if (declared.includes(page)) {
                errors.push(
                    `${manifestPath}: page "${page}" is declared more than once.`,
                );
            }

            declared.push(page);

            const file = join(pageRoot, `${page}.tsx`);

            if (realRoot === null || !existsSync(file)) {
                errors.push(
                    `${where} declares "${page}", but ${PAGE_ROOT}/${page}.tsx does not exist.`,
                );
                return;
            }

            // realpath follows symlinks, so a link that leaves the pages folder is refused as well as "..".
            const real = realpathSync(file);

            if (!real.startsWith(realRoot + sep)) {
                errors.push(
                    `${where} declares "${page}", which resolves outside ${PAGE_ROOT}.`,
                );
                return;
            }

            if (
                typeof layout === 'string' &&
                (LAYOUTS as readonly string[]).includes(layout)
            ) {
                pages.push({
                    addon: slug,
                    page,
                    layout: layout as Layout,
                    file: `${rel}/${PAGE_ROOT}/${page}.tsx`,
                });
            }
        });

        if (realRoot !== null) {
            for (const page of listTsxFiles(pageRoot)) {
                if (!declared.includes(page)) {
                    warnings.push(
                        `${rel}/${PAGE_ROOT}/${page}.tsx is not declared in provides.pages, so it is not built or mounted.`,
                    );
                }
            }
        }
    }

    // Keep the output independent of folder order, and of which folder was read first.
    pages.sort((a, b) =>
        `${a.addon}::${a.page}`.localeCompare(`${b.addon}::${b.page}`),
    );

    return { pages, errors, warnings };
}

const HEADER = `// Generated by tools/generate-addon-pages.ts from addons/*/addon.json. Do not edit by hand.\n// Run \`npm run addons:pages\` after changing an addon's provides.pages.\n`;

function moduleFor(
    exportName: string,
    pages: AddonPage[],
    layout: Layout,
): string {
    const entries = pages
        .filter((page) => page.layout === layout)
        .map((page) => {
            // No extension: tsconfig does not allow .tsx in import paths. Vite still resolves the same file.
            const importPath = `../../../${page.file.slice(0, -'.tsx'.length)}`;
            return `    '${page.addon}::${page.page}': () => import('${importPath}'),\n`;
        })
        .join('');

    return `${HEADER}\nexport const ${exportName}: Record<string, () => Promise<unknown>> = {\n${entries}};\n`;
}

/** The file name to content, relative to resources/js/generated. */
export function renderArtifacts(pages: AddonPage[]): Record<string, string> {
    return {
        'addon-pages.json': `${JSON.stringify(pages, null, 4)}\n`,
        'public-addon-pages.ts': moduleFor('publicAddonPages', pages, 'public'),
        'app-addon-pages.ts': moduleFor('appAddonPages', pages, 'app'),
    };
}

function main(argv: string[]): number {
    const repoRoot = process.cwd();
    const check = argv.includes('--check');
    const { pages, errors, warnings } = collectAddonPages(repoRoot);

    for (const warning of warnings) {
        console.warn(`warning: ${warning}`);
    }

    if (errors.length > 0) {
        for (const error of errors) {
            console.error(`error: ${error}`);
        }
        console.error(
            'Nothing was written. Fix the addon.json or the page files above, then run npm run addons:pages.',
        );
        return 1;
    }

    const outDir = resolve(repoRoot, GENERATED_DIR);
    const artifacts = renderArtifacts(pages);

    if (check) {
        const stale = Object.entries(artifacts).filter(([name, content]) => {
            const path = join(outDir, name);
            return !existsSync(path) || readFileSync(path, 'utf8') !== content;
        });

        if (stale.length > 0) {
            for (const [name] of stale) {
                console.error(`stale: ${GENERATED_DIR}/${name}`);
            }
            console.error('Run npm run addons:pages and commit the result.');
            return 1;
        }

        console.log(
            `${GENERATED_DIR} is up to date (${pages.length} addon pages).`,
        );
        return 0;
    }

    mkdirSync(outDir, { recursive: true });

    for (const [name, content] of Object.entries(artifacts)) {
        writeFileSync(join(outDir, name), content);
    }

    console.log(`Wrote ${GENERATED_DIR} (${pages.length} addon pages).`);
    return 0;
}

if (
    process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
    process.exitCode = main(process.argv.slice(2));
}
