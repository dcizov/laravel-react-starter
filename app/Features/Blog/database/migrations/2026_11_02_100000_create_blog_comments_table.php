<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Comments now live in the cms feature (cms_comments). Nothing to create if they already exist.
        if (Schema::hasTable('cms_comments') || Schema::hasTable('blog_comments')) {
            return;
        }

        Schema::create('blog_comments', function (Blueprint $table) {
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
        Schema::dropIfExists('blog_comments');
    }
};
