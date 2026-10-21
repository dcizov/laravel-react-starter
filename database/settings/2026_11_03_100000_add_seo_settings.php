<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Null means "not set", so no description or image is added to pages that do not have one.
        $this->migrator->add('app.seo_description', null);
        $this->migrator->add('app.seo_image', null);
        // Search engines may index the site unless an admin turns this off.
        $this->migrator->add('app.seo_allow_indexing', true);
        $this->migrator->add('app.seo_twitter', null);
    }

    public function down(): void
    {
        $this->migrator->delete('app.seo_description');
        $this->migrator->delete('app.seo_image');
        $this->migrator->delete('app.seo_allow_indexing');
        $this->migrator->delete('app.seo_twitter');
    }
};
