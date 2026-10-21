<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_connections', function (Blueprint $table) {
            $table->id();
            // The key from App\Features\Integrations\Catalogue, for example "stripe".
            $table->string('integration_key', 60)->unique();
            // All field values, encrypted as one blob. Secret values never leave the server.
            $table->text('credentials');
            $table->timestamp('connected_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_connections');
    }
};
