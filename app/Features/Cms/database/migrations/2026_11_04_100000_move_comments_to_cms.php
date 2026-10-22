<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Comments belong to the cms, so any content type with the comments support can have them, not only posts.
// An existing blog_comments table (from the blog feature) is renamed; otherwise the table is created fresh.
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cms_comments')) {
            return;
        }

        if (Schema::hasTable('blog_comments')) {
            Schema::rename('blog_comments', 'cms_comments');

            return;
        }

        Schema::create('cms_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('cms_entries')->cascadeOnDelete();
            $table->string('author_name', 80);
            $table->string('author_email', 160)->nullable();
            $table->text('body');
            // Comments wait for approval. Only approved ones are shown to visitors.
            $table->string('status', 16)->default('pending')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_comments');
    }
};
