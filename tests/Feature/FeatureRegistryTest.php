<?php

use App\Features\Feature;
use App\Features\FeatureManager;
use App\Features\FeatureRegistry;
use App\Features\Landing\LandingFeature;
use App\Features\Newsletter\NewsletterFeature;

// Two small features used to check dependencies. They are declared here so the tests do not depend on real features.
final class FakeBaseFeature extends Feature
{
    public static function slug(): string
    {
        return 'fake-base';
    }

    public static function label(): string
    {
        return 'Fake base';
    }

    public static function providers(): array
    {
        return [];
    }
}

final class FakeDependentFeature extends Feature
{
    public static function slug(): string
    {
        return 'fake-dependent';
    }

    public static function label(): string
    {
        return 'Fake dependent';
    }

    public static function providers(): array
    {
        return [];
    }

    public static function dependsOn(): array
    {
        return ['fake-base'];
    }
}

test('the registry lists every feature the code provides, by slug', function () {
    $available = app(FeatureRegistry::class)->available();

    expect(array_keys($available))->toEqual(['landing', 'newsletter', 'integrations'])
        ->and($available['landing'])->toBe(LandingFeature::class)
        ->and($available['newsletter'])->toBe(NewsletterFeature::class);
});

test('an unknown feature name in FEATURES is rejected with the known names', function () {
    config(['features.enabled' => ['landing', 'nope']]);

    expect(fn () => app(FeatureRegistry::class)->enabled())
        ->toThrow(InvalidArgumentException::class, 'Unknown feature(s): nope');
});

test('a feature whose dependency is not enabled is rejected', function () {
    config([
        'features.available' => [FakeBaseFeature::class, FakeDependentFeature::class],
        'features.enabled' => ['fake-dependent'],
    ]);

    expect(fn () => app(FeatureRegistry::class)->enabled())
        ->toThrow(InvalidArgumentException::class, 'Feature [fake-dependent] needs fake-base enabled too.');
});

test('a feature with its dependency enabled is accepted', function () {
    config([
        'features.available' => [FakeBaseFeature::class, FakeDependentFeature::class],
        'features.enabled' => ['fake-base', 'fake-dependent'],
    ]);

    expect(app(FeatureRegistry::class)->enabled())->toEqual(['fake-base', 'fake-dependent']);
});

test('disabling a feature that another enabled feature depends on is refused', function () {
    config([
        'features.available' => [FakeBaseFeature::class, FakeDependentFeature::class],
        'features.enabled' => ['fake-base', 'fake-dependent'],
    ]);

    // Refused before anything is written, so .env is not touched by this test.
    expect(fn () => app(FeatureManager::class)->disable('fake-base'))
        ->toThrow(InvalidArgumentException::class, 'Cannot disable [fake-base] while fake-dependent depends on it.');
});

test('enabling an unknown feature is refused before anything is written', function () {
    config(['features.enabled' => ['landing']]);

    expect(fn () => app(FeatureManager::class)->enable('nope', migrate: false))
        ->toThrow(InvalidArgumentException::class, 'Unknown feature [nope].');
});
