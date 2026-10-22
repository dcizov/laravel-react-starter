<?php

namespace App\Features\Seo\Seeders;

use App\Settings\AppSettings;
use Illuminate\Database\Seeder;

/**
 * Fills in a site description for the seo feature, so the search preview and the meta tags are not empty.
 * An existing description is kept.
 */
class SeoDemoSeeder extends Seeder
{
    public function run(): void
    {
        $settings = app(AppSettings::class);

        if (blank($settings->seo_description)) {
            $settings->seo_description = 'Ein modularer Laravel-und-React-Starter mit Landingpage, CMS, Blog und Newsletter.';
            $settings->save();
        }
    }
}
