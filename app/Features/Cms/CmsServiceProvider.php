<?php

namespace App\Features\Cms;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Policies\ContentEntryPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class CmsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');
        $this->loadRoutesFrom(__DIR__.'/routes.php');

        Gate::policy(ContentEntry::class, ContentEntryPolicy::class);
    }
}
