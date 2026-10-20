<?php

use App\Support\Rbac;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('app.app_name', config('app.name'));
        $this->migrator->add('app.default_role', Rbac::DEFAULT_ROLE);
    }
};
