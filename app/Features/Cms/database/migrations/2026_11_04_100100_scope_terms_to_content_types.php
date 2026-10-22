<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Categories and tags belong to one content type each. Existing terms were only used by posts, so they move to posts.
// Posts also gain the comments support, so comments work on them through the cms rather than the blog feature.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_terms', function (Blueprint $table) {
            $table->string('content_type', 40)->default('post')->after('id');
        });

        Schema::table('cms_terms', function (Blueprint $table) {
            $table->dropUnique(['taxonomy', 'slug']);
            $table->unique(['content_type', 'taxonomy', 'slug']);
            $table->index('content_type');
        });

        $post = DB::table('cms_content_types')->where('key', 'post')->first();

        if ($post) {
            $supports = json_decode((string) $post->supports, true) ?: [];

            if (! in_array('comments', $supports, true)) {
                $supports[] = 'comments';
                DB::table('cms_content_types')->where('key', 'post')->update(['supports' => json_encode(array_values($supports))]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('cms_terms', function (Blueprint $table) {
            $table->dropIndex(['content_type']);
            $table->dropUnique(['content_type', 'taxonomy', 'slug']);
            $table->unique(['taxonomy', 'slug']);
            $table->dropColumn('content_type');
        });
    }
};
