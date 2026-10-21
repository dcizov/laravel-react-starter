<?php

namespace App\Features\Integrations;

use App\Features\Feature;
use App\Support\Rbac;

/**
 * An admin catalogue of third-party tools. Admins connect a tool by saving its keys, which are stored
 * encrypted. Nothing calls the third-party services yet.
 */
final class IntegrationsFeature extends Feature
{
    public static function slug(): string
    {
        return 'integrations';
    }

    public static function label(): string
    {
        return 'Integrations';
    }

    public static function permissions(): array
    {
        return [Rbac::PERMISSION_INTEGRATIONS_MANAGE];
    }

    public static function providers(): array
    {
        return [IntegrationsServiceProvider::class];
    }
}
