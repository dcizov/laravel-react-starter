<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Null means "never saved", so the default theme is used. See App\Support\LandingBlocks::defaultTheme().
        $this->migrator->add('app.landing_theme_draft', null);
        $this->migrator->add('app.landing_theme', null);
    }
};
