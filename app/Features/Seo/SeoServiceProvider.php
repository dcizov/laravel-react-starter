<?php

namespace App\Features\Seo;

use Illuminate\Support\ServiceProvider;

class SeoServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');
        $this->loadRoutesFrom(__DIR__.'/routes.php');
    }
}
