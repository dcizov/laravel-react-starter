<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_ctas', function (Blueprint $table) {
            $table->id();
            // The name is for the admin list only. Visitors see the heading, text and button.
            $table->string('name', 120);
            $table->string('heading', 160);
            $table->text('text')->nullable();
            $table->string('button_label', 40)->nullable();
            $table->string('button_url', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_ctas');
    }
};
