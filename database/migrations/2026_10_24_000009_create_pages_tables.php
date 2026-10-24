<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('folder_id')->nullable()->index();
            $table->string('disk')->default('public');
            $table->string('path');
            $table->string('filename');
            $table->string('original_name');
            $table->string('mime');
            $table->string('type', 20)->default('image');
            $table->unsignedBigInteger('size')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('alt')->nullable();
            $table->text('caption')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('pages', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('status', 20)->default('draft')->index();
            $table->string('template')->default('page');
            $table->foreignId('parent_id')->nullable()->constrained('pages')->nullOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('excerpt')->nullable();
            $table->foreignId('featured_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->json('content');
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->foreignId('og_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('robots', 40)->default('index,follow');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('page_revisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->json('content');
            $table->string('label')->nullable();
            $table->timestamps();
        });

        // Every slug a page has ever had, so old URLs can answer with a 301.
        Schema::create('page_slugs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_slugs');
        Schema::dropIfExists('page_revisions');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('media');
    }
};
