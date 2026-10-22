<?php

namespace Tests\Support\Features;

use App\Features\Feature;

// A small feature used by the feature registry tests. It is declared in tests/Support so Composer's PSR-4 autoloading finds it.
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
