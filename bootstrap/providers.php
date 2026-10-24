<?php

declare(strict_types=1);

use App\Cms\Providers\CoreServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;
use Spatie\Activitylog\ActivitylogServiceProvider;
use Spatie\Permission\PermissionServiceProvider;

return [
    CoreServiceProvider::class,
    AppServiceProvider::class,
    FortifyServiceProvider::class,
    PermissionServiceProvider::class,
    ActivitylogServiceProvider::class,
];
