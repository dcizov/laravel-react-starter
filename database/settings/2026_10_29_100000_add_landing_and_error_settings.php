<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // The app's own error pages are on by default, as they were before this setting existed.
        $this->migrator->add('app.custom_error_pages', true);

        // The landing page is on by default, so the home URL keeps its current behaviour.
        $this->migrator->add('app.landing_enabled', true);

        // Null means "never saved", so the built-in default blocks are used. See App\Features\Landing\LandingBlocks::defaults().
        $this->migrator->add('app.landing_draft', null);
        $this->migrator->add('app.landing_published', null);
    }
};
