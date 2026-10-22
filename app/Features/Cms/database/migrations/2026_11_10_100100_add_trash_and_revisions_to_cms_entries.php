<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Trash: deleted entries stay in the database until they are removed for good, and can be restored.
// Revisions: an earlier version of an entry, saved before each change, so a change can be undone.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_entries', function (Blueprint $table) {
            $table->softDeletes();
            $table->index('deleted_at');
        });

        Schema::create('cms_entry_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('cms_entries')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 160);
            $table->string('slug', 160);
            $table->text('excerpt')->nullable();
            $table->json('body')->nullable();
            $table->string('featured_image', 500)->nullable();
            $table->string('status', 16);
            $table->timestamp('published_at')->nullable();
            $table->json('custom_fields')->nullable();
            $table->json('seo')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['entry_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_entry_revisions');

        Schema::table('cms_entries', function (Blueprint $table) {
            $table->dropIndex(['deleted_at']);
            $table->dropSoftDeletes();
        });
    }
};
