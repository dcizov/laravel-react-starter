<?php

namespace App\Features\Landing;

use App\Features\Feature;
use App\Support\Rbac;

/**
 * The public landing page at the home URL, and the visual builder that edits it.
 */
final class LandingFeature extends Feature
{
    public static function slug(): string
    {
        return 'landing';
    }

    public static function label(): string
    {
        return 'Landing page and visual builder';
    }

    public static function permissions(): array
    {
        return [Rbac::PERMISSION_LANDING_MANAGE];
    }

    public static function providers(): array
    {
        return [LandingServiceProvider::class];
    }
}
