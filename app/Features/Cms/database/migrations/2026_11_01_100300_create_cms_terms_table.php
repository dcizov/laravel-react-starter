<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_terms', function (Blueprint $table) {
            $table->id();
            // category or tag. See App\Features\Cms\Models\Term::TAXONOMIES.
            $table->string('taxonomy', 20);
            $table->string('name', 80);
            $table->string('slug', 80);
            $table->timestamps();

            $table->unique(['taxonomy', 'slug']);
        });

        Schema::create('cms_entry_terms', function (Blueprint $table) {
            $table->foreignId('entry_id')->constrained('cms_entries')->cascadeOnDelete();
            $table->foreignId('term_id')->constrained('cms_terms')->cascadeOnDelete();

            $table->primary(['entry_id', 'term_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_entry_terms');
        Schema::dropIfExists('cms_terms');
    }
};
