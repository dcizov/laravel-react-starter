<?php

use App\Addons\Manifest\AddonManifest;
use App\Addons\Manifest\AddonPages;
use Illuminate\Support\Str;

function pagesFolder(array $files): string
{
    $dir = sys_get_temp_dir().'/addon-undeclared-'.Str::random(12);

    foreach ($files as $relative => $contents) {
        $path = $dir.'/'.$relative;

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        file_put_contents($path, $contents);
    }

    register_shutdown_function(fn () => removeUndeclaredTree($dir));

    return $dir;
}

function removeUndeclaredTree(string $path): void
{
    if (is_link($path) || is_file($path)) {
        @unlink($path);

        return;
    }

    if (! is_dir($path)) {
        return;
    }

    foreach (scandir($path) ?: [] as $entry) {
        if ($entry !== '.' && $entry !== '..') {
            removeUndeclaredTree($path.'/'.$entry);
        }
    }

    @rmdir($path);
}

it('lists page files that no provides.pages entry declares', function () {
    $dir = pagesFolder([
        'resources/js/pages/subscribe.tsx' => '',
        'resources/js/pages/admin/newsletter.tsx' => '',
        'resources/js/pages/admin/extra.tsx' => '',
        'resources/js/pages/notes.md' => '',
    ]);

    expect(AddonPages::undeclared($dir, ['subscribe', 'admin/newsletter']))
        ->toBe(['resources/js/pages/admin/extra.tsx']);
});

it('reports nothing when the addon has no pages folder', function () {
    $dir = pagesFolder(['addon.json' => '{}']);

    expect(AddonPages::undeclared($dir, []))->toBe([]);
});

it('carries provides.pages into the manifest and defaults to none', function () {
    $base = [
        'name' => 'fixtures/pages',
        'slug' => 'pages',
        'version' => '1.0.0',
        'label' => 'Pages',
        'core' => '^1.0',
    ];

    $withPages = AddonManifest::fromValidated(
        [...$base, 'provides' => ['pages' => [['page' => 'subscribe', 'layout' => 'public']]]],
        '/addons/pages',
        'checksum',
    );

    $without = AddonManifest::fromValidated($base, '/addons/pages', 'checksum');

    expect($withPages->pages)->toBe([['page' => 'subscribe', 'layout' => 'public']])
        ->and($withPages->toArray()['pages'])->toBe([['page' => 'subscribe', 'layout' => 'public']])
        ->and($without->pages)->toBe([])
        ->and($without->toArray()['pages'])->toBe([]);
});
