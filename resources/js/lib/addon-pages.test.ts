import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    collectAddonPages,
    renderArtifacts,
} from '../../../tools/generate-addon-pages';
import {
    addonPageUrl,
    addonSlugOf,
    isPublicAddonPage,
    resolveAddonPage,
} from './addon-pages';
import { publicAddonPages } from '@/generated/public-addon-pages';
import { appAddonPages } from '@/generated/app-addon-pages';
import { addonPageUrls } from '@/generated/addon-page-urls';

const repoRoot = process.cwd();
const generated = (name: string) =>
    readFileSync(resolve(repoRoot, 'resources/js/generated', name), 'utf8');

describe('addon page artefacts agree with the manifests', () => {
    const collected = collectAddonPages(repoRoot);

    it('every page an addon manifest declares is in the generated list, and nothing else is', () => {
        expect(collected.errors).toEqual([]);
        expect(JSON.parse(generated('addon-pages.json'))).toEqual(
            collected.pages,
        );
    });

    it('the committed modules match what the generator renders, so a stale artefact fails here', () => {
        const rendered = renderArtifacts(collected.pages);

        for (const [name, content] of Object.entries(rendered)) {
            expect(
                generated(name),
                `${name} is stale; run npm run addons:pages`,
            ).toBe(content);
        }
    });

    it('every declared page has a loader in the map for its layout', () => {
        for (const page of collected.pages) {
            const map =
                page.layout === 'public' ? publicAddonPages : appAddonPages;
            expect(Object.keys(map), `${page.addon}::${page.page}`).toContain(
                `${page.addon}::${page.page}`,
            );
        }
    });

    it('the url map lists exactly the pages that declare a url', () => {
        const declared = collected.pages
            .filter((page) => page.url !== undefined)
            .map((page) => [`${page.addon}::${page.page}`, page.url]);

        expect(Object.entries(addonPageUrls)).toEqual(declared);
    });
});

describe('resolving an addon page at runtime', () => {
    it('shows a public page of an active addon', () => {
        expect(
            resolveAddonPage('newsletter::subscribe', ['newsletter']),
        ).toBeDefined();
    });

    it('shows an app page of an active addon', () => {
        expect(
            resolveAddonPage('newsletter::admin/newsletter', ['newsletter']),
        ).toBeDefined();
    });

    it('does not show a deactivated addon page, even though its chunk is in the build', () => {
        // The build map still has the page. The active-addon list is what turns it off.
        expect(Object.keys(publicAddonPages)).toContain(
            'newsletter::subscribe',
        );
        expect(resolveAddonPage('newsletter::subscribe', [])).toBeUndefined();
        expect(
            resolveAddonPage('newsletter::admin/newsletter', []),
        ).toBeUndefined();
    });

    it('does not show a page that the build does not have, even for an active addon', () => {
        expect(
            resolveAddonPage('newsletter::missing', ['newsletter']),
        ).toBeUndefined();
    });

    it('does not show anything when the server sends no addon list', () => {
        expect(
            resolveAddonPage('newsletter::subscribe', undefined),
        ).toBeUndefined();
        expect(
            resolveAddonPage('newsletter::subscribe', 'newsletter'),
        ).toBeUndefined();
    });

    it('reads the slug and the layout from the page name', () => {
        expect(addonSlugOf('newsletter::admin/newsletter')).toBe('newsletter');
        expect(addonSlugOf('dashboard')).toBeNull();
        expect(isPublicAddonPage('newsletter::subscribe')).toBe(true);
        expect(isPublicAddonPage('newsletter::admin/newsletter')).toBe(false);
    });
});

describe('the public url of an addon page, for links from core', () => {
    it('gives the declared url while the addon is active', () => {
        expect(addonPageUrl('newsletter::subscribe', ['newsletter'])).toBe(
            '/newsletter',
        );
    });

    it('gives nothing for an inactive addon, even though the url is in the build', () => {
        // The url map still has the entry. The active-addon list is what hides the link.
        expect(addonPageUrls['newsletter::subscribe']).toBe('/newsletter');
        expect(addonPageUrl('newsletter::subscribe', [])).toBeNull();
        expect(addonPageUrl('newsletter::subscribe', undefined)).toBeNull();
    });

    it('gives nothing for a page that declares no url', () => {
        expect(
            addonPageUrl('newsletter::unsubscribed', ['newsletter']),
        ).toBeNull();
    });
});
