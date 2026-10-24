<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('themes', function (Blueprint $table): void {
            $table->id();
            $table->string('handle')->unique();
            $table->string('name');
            $table->string('version');
            $table->string('provider');
            $table->json('manifest');
            $table->string('path');
            $table->boolean('is_active')->default(false)->index();
            $table->json('settings')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('themes');
    }
};
