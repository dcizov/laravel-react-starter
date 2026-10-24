<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per public page view. The dashboard aggregates it by day; the demo
 * seed fills a few months so the chart has a shape on a fresh install.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table): void {
            $table->id();
            $table->string('path');
            $table->foreignId('page_id')->nullable()->constrained()->nullOnDelete();
            $table->string('referrer')->nullable();
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
