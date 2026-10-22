<?php

namespace Tests\Support\Addons;

use App\Addons\AddonLifecycle;
use App\Addons\AddonRegistry;
use App\Addons\AddonRouteLoader;
use FilesystemIterator;
use Illuminate\Support\Str;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Gives a test its own addon folder and compiled manifest, so no test writes to bootstrap/cache or to the real
 * addons/ folder. The fixture is copied, because some tests change the copy on purpose.
 */
final class AddonSandbox
{
    public static function fixtureSource(): string
    {
        return dirname(__DIR__, 3).'/tests/Fixtures/addons/lifecycle-fixture';
    }

    /**
     * Create a temporary root with a copy of the fixture in its addons folder, and point the app at it.
     */
    public static function create(): string
    {
        $root = sys_get_temp_dir().'/addons-test-'.Str::random(12);

        mkdir($root.'/addons', 0775, true);
        mkdir($root.'/cache', 0775, true);
        self::copy(self::fixtureSource(), $root.'/addons/lifecycle-fixture');

        config([
            'addons.paths' => [$root.'/addons'],
            'addons.manifest_path' => $root.'/cache/addons.php',
            'addons.last_good_path' => $root.'/cache/addons.last-good.php',
            'addons.core_version' => '1.0.0',
            'addons.lifecycle-fixture.fail_at' => null,
        ]);

        app(AddonRegistry::class)->reload();

        return $root;
    }

    /**
     * Copy an addon from this repository into a temporary root, install and activate it, and register its routes.
     * The repository's addons folder and its compiled manifest are not touched.
     */
    public static function activateRepositoryAddon(string $slug): string
    {
        $root = sys_get_temp_dir().'/addons-test-'.Str::random(12);

        mkdir($root.'/addons', 0775, true);
        mkdir($root.'/cache', 0775, true);
        self::copy(dirname(__DIR__, 3).'/addons/'.$slug, $root.'/addons/'.$slug);

        config([
            'addons.paths' => [$root.'/addons'],
            'addons.manifest_path' => $root.'/cache/addons.php',
            'addons.last_good_path' => $root.'/cache/addons.last-good.php',
            'addons.core_version' => '1.0.0',
        ]);

        app(AddonRegistry::class)->reload();

        $lifecycle = app(AddonLifecycle::class);
        $lifecycle->install($slug);
        $lifecycle->activate($slug);

        AddonRouteLoader::register(app('router'), app(AddonRegistry::class));

        return $root;
    }

    public static function destroy(string $root): void
    {
        if (is_dir($root)) {
            self::remove($root);
        }
    }

    public static function addonPath(string $root, string $slug = 'lifecycle-fixture'): string
    {
        return $root.'/addons/'.$slug;
    }

    /**
     * The compiled manifest as it is on disk now.
     *
     * @return array<string, mixed>
     */
    public static function compiled(string $root): array
    {
        return require $root.'/cache/addons.php';
    }

    private static function copy(string $from, string $to): void
    {
        mkdir($to, 0775, true);

        $items = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($from, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($items as $item) {
            $target = $to.'/'.substr($item->getPathname(), strlen($from) + 1);

            if ($item->isDir()) {
                mkdir($target, 0775, true);
            } else {
                copy($item->getPathname(), $target);
            }
        }
    }

    private static function remove(string $path): void
    {
        $items = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST,
        );

        foreach ($items as $item) {
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }

        rmdir($path);
    }
}
