<?php

use App\Features\Blog\BlogFeature;
use App\Features\Cms\CmsFeature;
use App\Features\Integrations\IntegrationsFeature;
use App\Features\Landing\LandingFeature;
use App\Features\Newsletter\NewsletterFeature;
use App\Features\Seo\SeoFeature;

return [

    /*
    |--------------------------------------------------------------------------
    | Enabled features
    |--------------------------------------------------------------------------
    |
    | The features this installation uses, as a comma-separated list of slugs in FEATURES. Change it with
    | "php artisan feature:enable {name}" or "feature:disable {name}", or edit FEATURES in .env.
    | After a change, run "php artisan migrate" for a newly enabled feature and rebuild the frontend
    | with "npm run build" so its pages are included.
    |
    */

    'enabled' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('FEATURES', 'landing,newsletter,integrations')),
    ))),

    /*
    | Every feature the code provides. A feature is only loaded when it is enabled above.
    */

    'available' => [
        LandingFeature::class,
        NewsletterFeature::class,
        IntegrationsFeature::class,
        CmsFeature::class,
        BlogFeature::class,
        SeoFeature::class,
    ],

];
