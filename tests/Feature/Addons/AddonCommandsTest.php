<?php

use App\Addons\AddonRegistry;
use App\Models\Addon;
use Tests\Support\Addons\AddonSandbox;

const COMMAND_FIXTURE = 'lifecycle-fixture';

/** The temporary addon root of the running test. */
function commandsRoot(?string $set = null): string
{
    static $root = '';

    return $set === null ? $root : ($root = $set);
}

beforeEach(function () {
    commandsRoot(AddonSandbox::create());
});

afterEach(function () {
    AddonSandbox::destroy(commandsRoot());
});

test('addons:discover succeeds for a valid addon folder and fails for an invalid one', function () {
    $this->artisan('addons:discover')
        ->expectsOutputToContain(COMMAND_FIXTURE)
        ->assertExitCode(0);

    file_put_contents(AddonSandbox::addonPath(commandsRoot()).'/addon.json', '{"slug": ');

    $this->artisan('addons:discover')
        ->expectsOutputToContain('Invalid JSON')
        ->assertExitCode(1);
});

test('the install, activate and deactivate commands report success and refusals', function () {
    $this->artisan('addons:install', ['slug' => COMMAND_FIXTURE])->assertExitCode(0);
    $this->artisan('addons:install', ['slug' => COMMAND_FIXTURE])
        ->expectsOutputToContain('already installed')
        ->assertExitCode(1);

    $this->artisan('addons:activate', ['slug' => COMMAND_FIXTURE])->assertExitCode(0);
    expect(Addon::query()->where('slug', COMMAND_FIXTURE)->value('status'))->toBe(Addon::STATUS_ACTIVE);

    $this->artisan('addons:deactivate', ['slug' => COMMAND_FIXTURE])->assertExitCode(0);
    expect(Addon::query()->where('slug', COMMAND_FIXTURE)->value('status'))->toBe(Addon::STATUS_INACTIVE);

    $this->artisan('addons:deactivate', ['slug' => COMMAND_FIXTURE])
        ->expectsOutputToContain('is not active')
        ->assertExitCode(1);
});

test('addons:list --check fails when the compiled manifest is missing and passes after addons:compile', function () {
    $this->artisan('addons:install', ['slug' => COMMAND_FIXTURE])->assertExitCode(0);

    unlink(commandsRoot().'/cache/addons.php');

    $this->artisan('addons:list', ['--check' => true])->assertExitCode(1);
    $this->artisan('addons:list')->assertExitCode(0);

    $this->artisan('addons:compile')->assertExitCode(0);
    $this->artisan('addons:list', ['--check' => true])
        ->expectsOutputToContain('up to date')
        ->assertExitCode(0);
});

test('addons:compile reports a failure instead of writing a partial manifest', function () {
    $this->artisan('addons:install', ['slug' => COMMAND_FIXTURE])->assertExitCode(0);

    file_put_contents(AddonSandbox::addonPath(commandsRoot()).'/addon.json', '{"changed": true}');

    $this->artisan('addons:compile')
        ->expectsOutputToContain('was not written')
        ->assertExitCode(1);

    expect(app(AddonRegistry::class)->status())->toBe(AddonRegistry::STATUS_OK);
});
