<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Laravel's migration repository writes `migration` and `batch` only,
        // so every other column has to be nullable.
        Schema::create('addon_migrations', function (Blueprint $table): void {
            $table->id();
            $table->string('addon_handle')->nullable()->index();
            $table->string('migration');
            $table->integer('batch')->nullable();
            $table->timestamp('ran_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addon_migrations');
    }
};
