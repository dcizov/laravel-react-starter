<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Adds the built-in post type. Posts are ordinary entries of this type, so they share the content editor.
return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('cms_content_types')->where('key', 'post')->exists()) {
            return;
        }

        $now = now();

        DB::table('cms_content_types')->insert([
            'key' => 'post',
            'label' => 'Posts',
            'singular_label' => 'Post',
            'has_archive' => true,
            'supports' => json_encode(['excerpt', 'image', 'category', 'tag']),
            'fields' => json_encode([]),
            'builtin' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        DB::table('cms_content_types')->where('key', 'post')->where('builtin', true)->delete();
    }
};
