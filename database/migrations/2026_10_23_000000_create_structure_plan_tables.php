<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('pronouns')->nullable();
            $table->text('diagnoses');
            $table->string('status')->default('active');
            $table->string('risk_level')->default('low');
            $table->text('notes')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->timestamps();
        });

        Schema::create('treatment_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('focus')->default('integrated');
            $table->string('status')->default('active');
            $table->date('start_date');
            $table->date('review_date')->nullable();
            $table->unsignedTinyInteger('progress')->default(0);
            $table->json('goals')->nullable();
            $table->json('interventions')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('therapy_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('treatment_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('scheduled_at');
            $table->unsignedSmallInteger('duration')->default(50);
            $table->string('type')->default('individual');
            $table->string('status')->default('scheduled');
            $table->string('location')->default('video');
            $table->unsignedTinyInteger('mood_before')->nullable();
            $table->unsignedTinyInteger('mood_after')->nullable();
            $table->text('notes')->nullable();
            $table->text('homework')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'scheduled_at']);
        });

        Schema::create('check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->date('checked_in_on');
            $table->unsignedTinyInteger('mood');
            $table->unsignedTinyInteger('energy');
            $table->unsignedTinyInteger('focus');
            $table->decimal('sleep_hours', 3, 1)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'checked_in_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_ins');
        Schema::dropIfExists('therapy_sessions');
        Schema::dropIfExists('treatment_plans');
        Schema::dropIfExists('patients');
    }
};
