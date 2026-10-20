<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // No logo until an admin uploads one, so the default mark is shown.
        $this->migrator->add('app.app_logo_path', null);
    }
};
