<?php

use App\Cms\Providers\CoreServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;

return [
    CoreServiceProvider::class,
    AppServiceProvider::class,
    FortifyServiceProvider::class,
];
