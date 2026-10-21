<?php

namespace App\Features\Integrations;

use App\Features\Feature;
use App\Support\Rbac;

/**
 * An admin catalogue of third-party tools. GitHub connects with a saved access token. Gmail and Google Calendar
 * connect through Google sign-in. Tokens are stored encrypted. Nothing calls these services yet.
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
