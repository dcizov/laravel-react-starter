<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_content_types', function (Blueprint $table) {
            $table->id();
            // The key is also the public URL segment (/content/{key}) and must not change once created.
            $table->string('key', 40)->unique();
            $table->string('label', 80);
            $table->string('singular_label', 80);
            $table->boolean('has_archive')->default(false);
            $table->json('supports')->nullable();
            $table->json('fields')->nullable();
            // Built-in types cannot be deleted.
            $table->boolean('builtin')->default(false);
            $table->timestamps();
        });

        $now = now();

        DB::table('cms_content_types')->insert([
            'key' => 'page',
            'label' => 'Pages',
            'singular_label' => 'Page',
            'has_archive' => false,
            'supports' => json_encode(['excerpt', 'image']),
            'fields' => json_encode([]),
            'builtin' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_content_types');
    }
};
