<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('avatar_url')->nullable()->after('email');
            $table->json('preferences')->nullable()->after('avatar_url');
            $table->boolean('is_active')->default(true)->after('preferences');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
        });

        Schema::create('invitations', function (Blueprint $table): void {
            $table->id();
            $table->string('email')->index();
            $table->string('role');
            // Only the hash of the token is stored; the link is shown once.
            $table->string('token', 64)->unique();
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['avatar_url', 'preferences', 'is_active', 'last_login_at']);
        });
    }
};
