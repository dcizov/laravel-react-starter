<?php

declare(strict_types=1);

use App\Cms\Manifests\AddonManifest;
use App\Cms\Manifests\ManifestValidator;
use App\Cms\Support\VersionConstraint;

it('matches caret constraints', function () {
    expect(VersionConstraint::satisfies('13.36.0', '^13.0'))->toBeTrue()
        ->and(VersionConstraint::satisfies('0.9.0', '^1.0'))->toBeFalse()
        ->and(VersionConstraint::satisfies('0.2.5', '^0.2'))->toBeTrue()
        ->and(VersionConstraint::satisfies('0.3.0', '^0.2'))->toBeFalse()
        ->and(VersionConstraint::satisfies('1.0.0', '^2.0'))->toBeFalse();
});

it('matches tilde, wildcard, comparison and exact constraints', function () {
    expect(VersionConstraint::satisfies('1.2.9', '~1.2'))->toBeTrue()
        ->and(VersionConstraint::satisfies('1.3.0', '~1.2.3'))->toBeFalse()
        ->and(VersionConstraint::satisfies('8.4.1', '>=8.3'))->toBeTrue()
        ->and(VersionConstraint::satisfies('8.2.0', '>=8.3'))->toBeFalse()
        ->and(VersionConstraint::satisfies('8.4.0', '8.4.0'))->toBeTrue()
        ->and(VersionConstraint::satisfies('8.4.0', '8.4.1'))->toBeFalse()
        ->and(VersionConstraint::satisfies('1.2.3', '1.2.*'))->toBeTrue()
        ->and(VersionConstraint::satisfies('13.36.0', '*'))->toBeTrue()
        ->and(VersionConstraint::satisfies('13.36.0', '^12.0 || ^13.0'))->toBeTrue();
});

it('validates an addon manifest and reports every problem at once', function () {
    expect(ManifestValidator::validateAddon([
        'handle' => 'PostCraft',
        'name' => 'PostCraft',
        'version' => '1.0.0',
        'provider' => 'App\\Addons\\PostCraft\\PostCraftServiceProvider',
    ]))->toBe([]);

    $errors = ManifestValidator::validateAddon([
        'handle' => 'post-craft',
        'name' => 'PostCraft',
    ]);

    expect($errors)->toHaveCount(3)
        ->and(implode(' ', $errors))->toContain('StudlyCase')
        ->and(implode(' ', $errors))->toContain('[version]')
        ->and(implode(' ', $errors))->toContain('[provider]');
});

it('reads a manifest from disk without resolving the provider class', function () {
    $manifest = AddonManifest::fromPath(dirname(__DIR__, 2).'/app/Addons/Demo');

    expect($manifest->handle)->toBe('Demo')
        ->and($manifest->constraint('lattice'))->toBe('^0.1')
        ->and($manifest->navigation)->toHaveCount(1)
        ->and($manifest->navigation[0]['route'])->toBe('/admin/demo')
        ->and($manifest->toArray())->toHaveKey('permissions');
});
