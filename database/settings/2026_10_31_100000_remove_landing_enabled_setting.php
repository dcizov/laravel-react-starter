<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

// The landing page is now switched on and off with the FEATURES setting (see config/features.php),
// not with an admin toggle. This removes the old stored value.
return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->deleteIfExists('app.landing_enabled');
    }

    public function down(): void
    {
        $this->migrator->add('app.landing_enabled', true);
    }
};
