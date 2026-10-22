<?php

namespace Tests\Support\Features;

use App\Features\Feature;

// A small feature used by the feature registry tests. It is declared in tests/Support so Composer's PSR-4 autoloading finds it.
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
