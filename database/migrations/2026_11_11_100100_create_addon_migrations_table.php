<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The migrations of each addon that have run. Addon migrations are not recorded in Laravel's own migrations table,
// so php artisan migrate does not run them: the addon lifecycle does.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addon_migrations', function (Blueprint $table) {
            $table->id();
            $table->string('addon_slug', 40);
            $table->string('migration');
            $table->unsignedInteger('batch');
            $table->timestamp('applied_at');

            $table->unique(['addon_slug', 'migration']);
            $table->foreign('addon_slug')->references('slug')->on('addons')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addon_migrations');
    }
};
