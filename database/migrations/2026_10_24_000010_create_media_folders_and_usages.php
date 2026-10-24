<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_folders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('media_folders')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->index();
            $table->timestamps();
        });

        // Where a media item is referenced. Rows are rewritten on every page
        // save, so a stale usage can never block a delete.
        Schema::create('media_usages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->morphs('usable');
            $table->string('field')->nullable();
            $table->timestamps();

            $table->unique(['media_id', 'usable_type', 'usable_id', 'field']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_usages');
        Schema::dropIfExists('media_folders');
    }
};
