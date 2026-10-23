<?php

use App\Addons\AddonCompiler;
use App\Addons\AddonLifecycle;
use App\Addons\AddonRegistry;
use App\Addons\Exceptions\AddonLifecycleException;
use App\Addons\Exceptions\AddonManifestException;
use App\Models\Addon;
use App\Models\AuditLog;
use Tests\Support\Addons\AddonSandbox;

const UPDATE_FIXTURE = 'lifecycle-fixture';

/**
 * The temporary addon root of the running test. Set in beforeEach, read by the tests.
 */
function updateRoot(?string $set = null): string
{
    static $root = '';

    return $set === null ? $root : ($root = $set);
}

function updateManifestPath(): string
{
    return AddonSandbox::addonPath(updateRoot(), UPDATE_FIXTURE).'/addon.json';
}

/**
 * Change addon.json on disk: the given keys replace the ones in the current file.
 *
 * @param  array<string, mixed>  $changes
 */
function updateManifest(array $changes): void
{
    $data = json_decode((string) file_get_contents(updateManifestPath()), true);

    file_put_contents(updateManifestPath(), json_encode(array_replace($data, $changes), JSON_PRETTY_PRINT));
}

beforeEach(function () {
    updateRoot(AddonSandbox::create());
});

afterEach(function () {
    AddonSandbox::destroy(updateRoot());
});

test('addons:update records a changed version and checksum, and a second run changes nothing', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(UPDATE_FIXTURE);

    updateManifest(['version' => '1.1.0', 'label' => 'Lifecycle fixture (updated)']);

    $result = $lifecycle->update(UPDATE_FIXTURE);

    $addon = Addon::query()->where('slug', UPDATE_FIXTURE)->firstOrFail();

    expect($result->applied)->toBeTrue()
        ->and($addon->version)->toBe('1.1.0')
        ->and($addon->manifest_checksum)->toBe(hash('sha256', (string) file_get_contents(updateManifestPath())))
        ->and(AuditLog::query()->where('action', 'addon.updated')->count())->toBe(1)
        ->and(app(AddonCompiler::class)->problems())->toBe([]);

    $again = $lifecycle->update(UPDATE_FIXTURE);

    expect($again->unchanged)->toBeTrue()
        ->and($again->applied)->toBeFalse()
        ->and(AuditLog::query()->where('action', 'addon.updated')->count())->toBe(1);
});

test('an active addon that drifted is switched back on by addons:update, and only by it', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(UPDATE_FIXTURE);
    $lifecycle->activate(UPDATE_FIXTURE);

    updateManifest(['version' => '1.1.0']);
    app(AddonCompiler::class)->compile();

    expect(app(AddonRegistry::class)->isActive(UPDATE_FIXTURE))->toBeFalse();

    $lifecycle->update(UPDATE_FIXTURE);

    $compiled = AddonSandbox::compiled(updateRoot());

    expect(app(AddonRegistry::class)->isActive(UPDATE_FIXTURE))->toBeTrue()
        ->and($compiled['addons'][UPDATE_FIXTURE])->not->toHaveKey('drifted')
        ->and($compiled['addons'][UPDATE_FIXTURE]['enabled'])->toBeTrue();
});

test('a dry run shows the change and writes nothing', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(UPDATE_FIXTURE);

    $before = Addon::query()->where('slug', UPDATE_FIXTURE)->firstOrFail();
    $compiledBefore = file_get_contents(updateRoot().'/cache/addons.php');

    updateManifest(['version' => '1.1.0']);

    $result = $lifecycle->update(UPDATE_FIXTURE, dryRun: true);

    $after = Addon::query()->where('slug', UPDATE_FIXTURE)->firstOrFail();

    expect($result->applied)->toBeFalse()
        ->and($result->changes)->toContain('version: "1.0.0" -> "1.1.0"')
        ->and($after->version)->toBe($before->version)
        ->and($after->manifest_checksum)->toBe($before->manifest_checksum)
        ->and(file_get_contents(updateRoot().'/cache/addons.php'))->toBe($compiledBefore)
        ->and(AuditLog::query()->where('action', 'addon.updated')->exists())->toBeFalse();
});

test('an invalid addon.json is refused, and nothing is recorded', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(UPDATE_FIXTURE);

    $checksum = Addon::query()->where('slug', UPDATE_FIXTURE)->firstOrFail()->manifest_checksum;

    file_put_contents(updateManifestPath(), '{"slug": ');

    expect(fn () => $lifecycle->update(UPDATE_FIXTURE))->toThrow(AddonManifestException::class);

    expect(Addon::query()->where('slug', UPDATE_FIXTURE)->firstOrFail()->manifest_checksum)->toBe($checksum)
        ->and(AuditLog::query()->where('action', 'addon.updated')->exists())->toBeFalse();
});

test('a changed package name is refused, because it is not an update', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(UPDATE_FIXTURE);

    updateManifest(['name' => 'fixtures/renamed']);

    expect(fn () => $lifecycle->update(UPDATE_FIXTURE))
        ->toThrow(AddonLifecycleException::class, 'That is not an update');
});

test('a changed table set is refused without --allow-tables, and accepted with it', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(UPDATE_FIXTURE);

    $tables = ['lifecycle_fixture_items', 'lifecycle_fixture_extra'];
    $provides = json_decode((string) file_get_contents(updateManifestPath()), true)['provides'];
    updateManifest(['provides' => array_replace($provides, ['tables' => $tables])]);

    expect(fn () => $lifecycle->update(UPDATE_FIXTURE))
        ->toThrow(AddonLifecycleException::class, '--allow-tables');

    $result = $lifecycle->update(UPDATE_FIXTURE, allowTables: true);

    expect($result->applied)->toBeTrue()
        ->and(Addon::query()->where('slug', UPDATE_FIXTURE)->firstOrFail()->version)->toBe('1.0.0');
});

test('a lower version is refused, and --force records it with its consequence in the audit trail', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(UPDATE_FIXTURE);

    Addon::query()->where('slug', UPDATE_FIXTURE)->update(['version' => '2.0.0']);

    expect(fn () => $lifecycle->update(UPDATE_FIXTURE))
        ->toThrow(AddonLifecycleException::class, 'Downgrades are refused');

    $result = $lifecycle->update(UPDATE_FIXTURE, force: true);

    expect($result->applied)->toBeTrue()
        ->and($result->downgrade)->toBeTrue()
        ->and(Addon::query()->where('slug', UPDATE_FIXTURE)->firstOrFail()->version)->toBe('1.0.0')
        ->and(collect($result->changes)->contains(fn (string $line): bool => str_contains($line, 'not reversed')))->toBeTrue()
        ->and(AuditLog::query()->where('action', 'addon.updated')->firstOrFail()->properties['downgrade'])->toBeTrue();
});

test('addons:update exits 0 for a dry run and 1 for a refusal', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(UPDATE_FIXTURE);

    updateManifest(['version' => '1.1.0']);

    $this->artisan('addons:update', ['slug' => UPDATE_FIXTURE, '--dry-run' => true])->assertExitCode(0);

    updateManifest(['name' => 'fixtures/renamed']);

    $this->artisan('addons:update', ['slug' => UPDATE_FIXTURE])->assertExitCode(1);
});
