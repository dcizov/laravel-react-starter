<?php

use App\Addons\Demo\DemoServiceProvider;
use App\Cms\Addons\AddonManager;
use App\Cms\Boot\ProviderLoader;
use App\Cms\Manifests\AddonManifest;
use App\Cms\Registries\Navigation;
use App\Cms\Repositories\AddonRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

/**
 * Simulate the next HTTP request: a fresh application that boots from the
 * database only. This is the behaviour that matters — not what happens to
 * live singletons inside one process.
 */
function bootFreshApplication(): void
{
    test()->refreshApplication();
}

function navigationLabels(): array
{
    return array_map(
        static fn (array $item): string => $item['label'],
        app(Navigation::class)->raw(),
    );
}

function installDemoManifest(): AddonManifest
{
    $manifest = AddonManifest::fromPath(config('lattice.paths.addons').'/Demo');

    app(AddonManager::class)->install($manifest);

    return $manifest;
}

beforeEach(function () {
    // The demo addon folder ships with the repository; the database starts
    // empty because DatabaseMigrations migrated it fresh.
    $this->manager = app(AddonManager::class);
    $this->addons = app(AddonRepository::class);
});

it('installs an addon as inactive without running its migrations', function () {
    installDemoManifest();

    $row = $this->addons->find('Demo');

    expect($row)->not->toBeNull()
        ->and($row->status)->toBe('inactive')
        ->and(DB::getSchemaBuilder()->hasTable('demo_notes'))->toBeFalse();
});

it('activates an addon: routes, navigation and migrations appear', function () {
    installDemoManifest();

    $this->manager->activate('Demo');

    expect($this->addons->find('Demo')->status)->toBe('active')
        ->and(Route::has('demo.index'))->toBeTrue()
        ->and(DB::getSchemaBuilder()->hasTable('demo_notes'))->toBeTrue()
        ->and(DB::table('addon_migrations')->where('addon_handle', 'Demo')->count())->toBe(1)
        ->and(navigationLabels())->toContain('Demo');
});

it('boots an active addon from the database on the next request', function () {
    installDemoManifest();
    $this->manager->activate('Demo');

    bootFreshApplication();

    expect(Route::has('demo.index'))->toBeTrue()
        ->and(navigationLabels())->toContain('Demo')
        ->and(app(AddonRepository::class)->activeManifests())->toHaveCount(1);
});

it('deactivates an addon: routes and navigation disappear, data remains', function () {
    installDemoManifest();
    $this->manager->activate('Demo');
    DB::table('demo_notes')->insert(['body' => 'Kept across deactivation', 'created_at' => now(), 'updated_at' => now()]);

    $this->manager->deactivate('Demo');
    bootFreshApplication();

    expect(Route::has('demo.index'))->toBeFalse()
        ->and(navigationLabels())->not->toContain('Demo')
        ->and(DB::getSchemaBuilder()->hasTable('demo_notes'))->toBeTrue()
        ->and(DB::table('demo_notes')->where('body', 'Kept across deactivation')->count())->toBe(1)
        ->and(app(AddonRepository::class)->activeManifests())->toBeEmpty();
});

it('rejects an addon whose runtime requirements are not met', function () {
    $path = config('lattice.paths.addons').'/Incompatible';
    File::ensureDirectoryExists($path);
    File::put($path.'/addon.json', json_encode([
        'handle' => 'Incompatible',
        'name' => 'Incompatible',
        'version' => '1.0.0',
        'provider' => 'App\\Addons\\Incompatible\\IncompatibleServiceProvider',
        'requires' => ['lattice' => '^2.0'],
    ]));

    try {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Requires lattice ^2.0');

        $this->manager->install(AddonManifest::fromPath($path));
    } finally {
        File::deleteDirectory($path);
    }
});

it('refuses to activate an addon whose provider class is missing', function () {
    $path = config('lattice.paths.addons').'/Ghost';
    File::ensureDirectoryExists($path);
    File::put($path.'/addon.json', json_encode([
        'handle' => 'Ghost',
        'name' => 'Ghost',
        'version' => '1.0.0',
        'provider' => 'App\\Addons\\Ghost\\GhostServiceProvider',
    ]));

    try {
        $this->manager->install(AddonManifest::fromPath($path));

        expect(fn () => $this->manager->activate('Ghost'))
            ->toThrow(RuntimeException::class, 'does not exist');

        expect($this->addons->find('Ghost')->status)->toBe('error');
    } finally {
        File::deleteDirectory($path);
    }
});

it('keeps booting when an active provider throws and records the error', function () {
    $path = config('lattice.paths.addons').'/Boom';
    File::ensureDirectoryExists($path.'/src');
    File::put($path.'/addon.json', json_encode([
        'handle' => 'Boom',
        'name' => 'Boom',
        'version' => '1.0.0',
        'provider' => 'App\\Addons\\Boom\\BoomServiceProvider',
        'migrations' => false,
    ]));
    File::put($path.'/BoomServiceProvider.php', <<<'PHP'
    <?php

    namespace App\Addons\Boom;

    use Illuminate\Support\ServiceProvider;

    class BoomServiceProvider extends ServiceProvider
    {
        public function register(): void
        {
            throw new \RuntimeException('This provider is deliberately broken.');
        }
    }
    PHP);

    try {
        require_once $path.'/BoomServiceProvider.php';

        $this->manager->install(AddonManifest::fromPath($path));
        $this->addons->setStatus('Boom', 'active');

        bootFreshApplication();

        $row = app(AddonRepository::class)->find('Boom');

        // The app still booted, still serves the admin, and flagged the addon.
        $this->get('/login')->assertOk();
        expect($row->status)->toBe('error')
            ->and($row->last_error)->toContain('deliberately broken')
            ->and(app(ProviderLoader::class))->not->toBeNull();
    } finally {
        File::deleteDirectory($path);
    }
});

it('uninstalls an addon, dropping only its own tables', function () {
    installDemoManifest();
    $this->manager->activate('Demo');

    $folder = config('lattice.paths.addons').'/Demo';

    // keep the folder (it ships with the repository); data goes away
    $this->manager->uninstall('Demo', deleteData: true, deleteFiles: false);

    expect($this->addons->find('Demo'))->toBeNull()
        ->and(DB::getSchemaBuilder()->hasTable('demo_notes'))->toBeFalse()
        ->and(DB::getSchemaBuilder()->hasTable('addons'))->toBeTrue()
        ->and(DB::getSchemaBuilder()->hasTable('users'))->toBeTrue()
        ->and(File::isDirectory($folder))->toBeTrue()
        ->and(class_exists(DemoServiceProvider::class))->toBeTrue();
});

it('uninstalls an addon keeping its data when asked', function () {
    installDemoManifest();
    $this->manager->activate('Demo');

    $this->manager->uninstall('Demo', deleteData: false, deleteFiles: false);

    expect($this->addons->find('Demo'))->toBeNull()
        ->and(DB::getSchemaBuilder()->hasTable('demo_notes'))->toBeTrue();
});
