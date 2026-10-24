<?php

declare(strict_types=1);

namespace App\Addons\PostCraft;

use App\Addons\PostCraft\Sections\BlogTeaser;
use App\Cms\Sections\SectionRegistry;
use Illuminate\Support\ServiceProvider;

/**
 * PostCraft registers its routes, its views and the one section it adds to the
 * page builder. Everything else — navigation, permissions, tables — comes from
 * addon.json and the addon's own migration.
 */
class PostCraftServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/routes/admin.php');
        $this->loadRoutesFrom(__DIR__.'/routes/public.php');
        $this->loadViewsFrom(__DIR__.'/resources/views', 'postcraft');

        $this->app->make(SectionRegistry::class)->add(BlogTeaser::make());
    }
}
