<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addons', function (Blueprint $table): void {
            $table->id();
            $table->string('handle')->unique();
            $table->string('name');
            $table->string('version');
            $table->string('provider');
            $table->json('manifest');
            $table->string('status')->default('inactive')->index();
            $table->text('last_error')->nullable();
            $table->string('path');
            $table->timestamp('installed_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addons');
    }
};
