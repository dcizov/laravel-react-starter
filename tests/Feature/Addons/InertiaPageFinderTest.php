<?php

use Tests\Support\Addons\AddonSandbox;

// Inertia's component check finds a page by its file. An addon page is named <slug>::<page>, and the finder maps
// the slug to the addon's resources/js/pages folder, so nested pages resolve in tests too.

test('a nested page of the newsletter addon resolves in the inertia testing environment', function () {
    expect(app('inertia.view-finder')->find('newsletter::admin/newsletter'))
        ->toEndWith('addons/newsletter/resources/js/pages/admin/newsletter.tsx');
});

test('a nested page of any addon folder resolves, not only newsletter', function () {
    $root = AddonSandbox::create();

    try {
        $folder = AddonSandbox::addonPath($root).'/resources/js/pages/admin/deep';
        mkdir($folder, 0775, true);
        file_put_contents($folder.'/page.tsx', 'export default function Page() { return null; }');

        expect(app('inertia.view-finder')->find('lifecycle-fixture::admin/deep/page'))
            ->toEndWith('lifecycle-fixture/resources/js/pages/admin/deep/page.tsx');
    } finally {
        AddonSandbox::destroy($root);
    }
});

test('a page that does not exist is still reported, and the page check stays on', function () {
    expect(fn () => app('inertia.view-finder')->find('newsletter::admin/missing'))
        ->toThrow(InvalidArgumentException::class)
        ->and(config('inertia.testing.ensure_pages_exist'))->toBeTrue();
});

test('a namespace with no addon folder is still reported', function () {
    expect(fn () => app('inertia.view-finder')->find('no-such-addon::page'))
        ->toThrow(InvalidArgumentException::class);
});
