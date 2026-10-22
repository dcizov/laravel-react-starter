<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Test seam: with fail_at set to "migrate", the table is created and then the migration throws, so the test can check
// that the transaction rolled the table back and that the migration was not recorded as applied.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lifecycle_fixture_items', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->timestamps();
        });

        if (config('addons.lifecycle-fixture.fail_at') === 'migrate') {
            throw new RuntimeException('Simulated failure in the lifecycle fixture migration.');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lifecycle_fixture_items');
    }
};
