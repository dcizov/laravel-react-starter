<?php

declare(strict_types=1);

namespace App\Addons\Demo;

use Illuminate\Support\ServiceProvider;

/**
 * Reference addon. It registers its own routes and views; its navigation
 * entry, permission and requirements come from addon.json so the core never
 * has to know this class exists.
 */
class DemoServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/routes/admin.php');
        $this->loadViewsFrom(__DIR__.'/resources/views', 'demo');
    }
}
