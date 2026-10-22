<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Sites for multi-site publishing. Content belongs to one site. The first site is the default one: it serves the
// landing page and any address that no other site claims. Existing content is attached to it by the cms migrations.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 40)->unique();
            // The host name that serves this site, such as news.example.com. Empty sites are reached by path only.
            $table->string('domain', 190)->nullable()->unique();
            $table->string('locale', 5)->default('en');
            $table->boolean('is_default')->default(false)->index();
            // Per-site settings: description (SEO default), home_slug (the page that is the site's home).
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        $locale = in_array(config('app.locale'), ['en', 'de'], true) ? config('app.locale') : 'en';

        DB::table('sites')->insert([
            'name' => (string) config('app.name', 'Laravel'),
            'slug' => 'main',
            'domain' => null,
            'locale' => $locale,
            'is_default' => true,
            'settings' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
