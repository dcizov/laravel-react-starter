<?php

use App\Addons\AddonCompiler;
use App\Addons\AddonLifecycle;
use App\Addons\AddonRegistry;
use App\Models\Addon;
use Illuminate\Support\Facades\Log;
use Tests\Support\Addons\AddonSandbox;

const DRIFT_FIXTURE = 'lifecycle-fixture';
const DRIFT_OTHER = 'second-fixture';

/**
 * The temporary addon root of the running test. Set in beforeEach, read by the tests.
 */
function driftRoot(?string $set = null): string
{
    static $root = '';

    return $set === null ? $root : ($root = $set);
}

/**
 * Change the bytes of an installed addon's addon.json without breaking it: same content, different bytes.
 */
function driftFixtureManifest(): void
{
    $file = AddonSandbox::addonPath(driftRoot(), DRIFT_FIXTURE).'/addon.json';

    file_put_contents($file, json_encode(json_decode((string) file_get_contents($file), true), JSON_PRETTY_PRINT)."\n");
}

/**
 * A second, minimal addon in the temporary root. It has no tables, permissions or provider.
 */
function addDriftOtherAddon(): void
{
    $dir = AddonSandbox::addonPath(driftRoot(), DRIFT_OTHER);

    mkdir($dir, 0775, true);
    file_put_contents($dir.'/addon.json', json_encode([
        'name' => 'fixtures/'.DRIFT_OTHER,
        'slug' => DRIFT_OTHER,
        'version' => '1.0.0',
        'label' => 'Second fixture',
        'core' => '^1.0',
    ], JSON_PRETTY_PRINT));
}

beforeEach(function () {
    driftRoot(AddonSandbox::create());
});

afterEach(function () {
    AddonSandbox::destroy(driftRoot());
});

test('one drifted addon does not stop another addon from being deactivated or activated', function () {
    addDriftOtherAddon();

    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(DRIFT_FIXTURE);
    $lifecycle->activate(DRIFT_FIXTURE);
    $lifecycle->install(DRIFT_OTHER);
    $lifecycle->activate(DRIFT_OTHER);

    driftFixtureManifest();

    expect($lifecycle->deactivate(DRIFT_OTHER)->status)->toBe(Addon::STATUS_INACTIVE)
        ->and($lifecycle->activate(DRIFT_OTHER)->status)->toBe(Addon::STATUS_ACTIVE);

    $compiled = AddonSandbox::compiled(driftRoot());

    expect($compiled['addons'][DRIFT_FIXTURE]['drifted'])->toBeTrue()
        ->and($compiled['addons'][DRIFT_FIXTURE]['enabled'])->toBeFalse()
        ->and($compiled['addons'][DRIFT_OTHER]['enabled'])->toBeTrue();
});

test('a drifted addon is not active at runtime, while its routes and pages are not compiled', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(DRIFT_FIXTURE);
    $lifecycle->activate(DRIFT_FIXTURE);

    driftFixtureManifest();
    app(AddonCompiler::class)->compile();

    $entry = AddonSandbox::compiled(driftRoot())['addons'][DRIFT_FIXTURE];

    expect($entry['routes'])->toBeNull()
        ->and($entry['provider'])->toBeNull()
        ->and($entry['pages'])->toBe([])
        ->and($entry['permissions'])->toBe([]);

    expect(app(AddonRegistry::class)->isActive(DRIFT_FIXTURE))->toBeFalse();
});

test('boot-time drift switches an enabled addon off for this process, and logs one warning that names it', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(DRIFT_FIXTURE);
    $lifecycle->activate(DRIFT_FIXTURE);

    Log::spy();
    driftFixtureManifest();

    $registry = new AddonRegistry;

    expect($registry->isActive(DRIFT_FIXTURE))->toBeFalse()
        ->and($registry->isActive(DRIFT_FIXTURE))->toBeFalse()
        ->and($registry->status())->toBe(AddonRegistry::STATUS_OK);

    Log::shouldHaveReceived('warning')
        ->once()
        ->withArgs(fn (string $message): bool => str_contains($message, DRIFT_FIXTURE));
});

test('boot does not throw when an addon has drifted, and the compiled file still names it', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(DRIFT_FIXTURE);
    $lifecycle->activate(DRIFT_FIXTURE);

    driftFixtureManifest();

    expect(fn () => new AddonRegistry)->not->toThrow(Throwable::class);
    expect((new AddonRegistry)->installed())->toHaveKey(DRIFT_FIXTURE);
});
