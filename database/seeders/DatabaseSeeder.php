<?php

namespace Database\Seeders;

use App\Features\Blog\Seeders\BlogDemoSeeder;
use App\Features\Cms\Seeders\CmsDemoSeeder;
use App\Features\FeatureRegistry;
use App\Features\Landing\Seeders\LandingDemoSeeder;
use App\Features\Seo\Seeders\SeoDemoSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with roles, example users, and tasks.
     * The demo content of each feature is only added while that feature is enabled in FEATURES.
     */
    public function run(): void
    {
        $this->call([
            RbacSeeder::class,
            UserSeeder::class,
            TaskSeeder::class,
        ]);

        $features = app(FeatureRegistry::class);

        if ($features->isEnabled('cms')) {
            $this->call(CmsDemoSeeder::class);
            $this->call(SitesDemoSeeder::class);
        }

        if ($features->isEnabled('blog')) {
            $this->call(BlogDemoSeeder::class);
        }

        if ($features->isEnabled('seo')) {
            $this->call(SeoDemoSeeder::class);
        }

        if ($features->isEnabled('landing') && $features->isEnabled('blog')) {
            $this->call(LandingDemoSeeder::class);
        }
    }
}
