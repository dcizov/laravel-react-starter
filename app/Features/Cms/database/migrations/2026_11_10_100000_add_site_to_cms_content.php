<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Entries, categories and tags, and calls to action belong to a site. Every existing row is attached to the
// default site, so nothing moves and existing URLs keep working. Slugs become unique per site.
return new class extends Migration
{
    public function up(): void
    {
        $siteId = (int) DB::table('sites')->where('is_default', true)->value('id');

        if ($siteId === 0) {
            throw new RuntimeException('The default site is missing. Run the sites migration first.');
        }

        foreach (['cms_entries', 'cms_terms', 'cms_ctas'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('site_id')->nullable()->after('id')->constrained('sites')->restrictOnDelete();
            });

            DB::table($table)->whereNull('site_id')->update(['site_id' => $siteId]);
        }

        Schema::table('cms_entries', function (Blueprint $table) {
            $table->dropUnique(['content_type', 'slug']);
            $table->unique(['site_id', 'content_type', 'slug']);
        });

        Schema::table('cms_terms', function (Blueprint $table) {
            $table->dropUnique(['content_type', 'taxonomy', 'slug']);
            $table->unique(['site_id', 'content_type', 'taxonomy', 'slug']);
        });

        foreach (['cms_entries', 'cms_terms', 'cms_ctas'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                // Every row has a site now, so the column can be required.
                $blueprint->foreignId('site_id')->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('cms_entries', function (Blueprint $table) {
            $table->dropUnique(['site_id', 'content_type', 'slug']);
            $table->unique(['content_type', 'slug']);
        });

        Schema::table('cms_terms', function (Blueprint $table) {
            $table->dropUnique(['site_id', 'content_type', 'taxonomy', 'slug']);
            $table->unique(['content_type', 'taxonomy', 'slug']);
        });

        foreach (['cms_entries', 'cms_terms', 'cms_ctas'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropConstrainedForeignId('site_id');
            });
        }
    }
};
