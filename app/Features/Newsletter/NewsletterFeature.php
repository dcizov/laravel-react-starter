<?php

namespace App\Features\Newsletter;

use App\Features\Feature;

/**
 * A newsletter sign-up page for visitors, and a list of subscribers for admins.
 */
final class NewsletterFeature extends Feature
{
    public static function slug(): string
    {
        return 'newsletter';
    }

    public static function label(): string
    {
        return 'Newsletter';
    }

    public static function providers(): array
    {
        return [NewsletterServiceProvider::class];
    }
}
