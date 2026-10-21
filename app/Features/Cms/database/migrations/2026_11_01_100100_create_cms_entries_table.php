<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_entries', function (Blueprint $table) {
            $table->id();
            $table->string('content_type', 40)->index();
            $table->string('title', 160);
            $table->string('slug', 160);
            $table->text('excerpt')->nullable();
            // Content blocks, as a list of {id, type, data}. Never raw HTML.
            $table->json('body')->nullable();
            $table->string('featured_image', 500)->nullable();
            $table->string('status', 16)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            // Values for the custom fields the content type defines, keyed by field key.
            $table->json('custom_fields')->nullable();
            // Per-entry SEO overrides: title, description, noindex. Used when the seo feature is on.
            $table->json('seo')->nullable();
            $table->timestamps();

            $table->unique(['content_type', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_entries');
    }
};
