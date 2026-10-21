<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Saved sidebar choices used to list the visible items. A list of visible
 * items hides every item added later, so we store the hidden items instead.
 *
 * Users who saved before the newsletter and integrations items existed are
 * converted using the items that were available at that point.
 */
return new class extends Migration
{
    /**
     * The sidebar items that existed before hidden items were stored.
     *
     * @var list<string>
     */
    private const ITEMS_BEFORE = [
        'dashboard',
        'user-profile',
        'users',
        'admin-roles',
        'admin-permissions',
        'admin-users',
        'audit-log',
        'admin-landing',
        'tasks',
        'settings',
        'repository',
        'documentation',
    ];

    /**
     * The sidebar items when this migration was written. Kept here so the migration
     * does not change when the app's list changes later.
     *
     * @var list<string>
     */
    private const ITEMS_NOW = [
        'dashboard',
        'user-profile',
        'users',
        'admin-roles',
        'admin-permissions',
        'admin-users',
        'audit-log',
        'admin-landing',
        'admin-newsletter',
        'admin-integrations',
        'tasks',
        'settings',
        'repository',
        'documentation',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('hidden_display_items')->nullable()->after('locale');
        });

        DB::table('users')
            ->whereNotNull('display_items')
            ->select(['id', 'display_items'])
            ->chunkById(500, function ($users) {
                foreach ($users as $user) {
                    $visible = json_decode($user->display_items, true);

                    if (! is_array($visible) || $visible === []) {
                        continue;
                    }

                    $hidden = array_values(array_diff(self::ITEMS_BEFORE, $visible));

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['hidden_display_items' => json_encode($hidden)]);
                }
            });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('display_items');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('display_items')->nullable()->after('locale');
        });

        DB::table('users')
            ->whereNotNull('hidden_display_items')
            ->select(['id', 'hidden_display_items'])
            ->chunkById(500, function ($users) {
                foreach ($users as $user) {
                    $hidden = json_decode($user->hidden_display_items, true) ?? [];
                    $visible = array_values(array_diff(self::ITEMS_NOW, $hidden));

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['display_items' => json_encode($visible)]);
                }
            });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('hidden_display_items');
        });
    }
};
