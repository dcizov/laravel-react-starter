<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Lifecycle state of each installed addon. The compiled manifest that the app reads at boot is written from this table.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addons', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 40)->unique();
            $table->string('name');
            $table->string('version', 64);
            // One of App\Models\Addon::STATUSES. Kept as a string so the values can change without a schema change.
            $table->string('status', 20)->index();
            $table->boolean('enabled')->default(false);
            // The addon folder, as an absolute path on this server.
            $table->string('path');
            $table->char('manifest_checksum', 64);
            $table->text('last_error')->nullable();
            $table->timestamp('installed_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addons');
    }
};
