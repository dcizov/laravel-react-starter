<?php

namespace Addons\Newsletter;

use Addons\Newsletter\Models\NewsletterSubscriber;
use App\Addons\AddonRegistry;
use App\Support\Dashboard\DashboardCards;
use App\Support\Rbac;
use Illuminate\Support\ServiceProvider;

/**
 * The newsletter addon's service provider. The addon lifecycle loads its routes and runs its migrations. This
 * provider adds the newsletter card to the dashboard. It is registered only while the addon is active, and the
 * card also checks that the addon is active, so it never shows for an addon that has been switched off.
 */
class NewsletterServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        app(DashboardCards::class)->register(
            key: 'newsletter',
            owner: 'newsletter',
            permission: Rbac::PERMISSION_NEWSLETTER_MANAGE,
            card: fn (): array => [
                'subscribed' => NewsletterSubscriber::query()
                    ->where('status', NewsletterSubscriber::SUBSCRIBED)
                    ->count(),
            ],
            visible: fn (): bool => app(AddonRegistry::class)->isActive('newsletter'),
        );
    }
}
