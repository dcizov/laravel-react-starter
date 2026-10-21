<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/*
 * The catalogue now lists GitHub, Gmail and Google Calendar only. Connections for the other tools
 * are removed, including their saved keys, since nothing uses them.
 */
return new class extends Migration
{
    /**
     * @var list<string>
     */
    private const KEYS = ['github', 'gmail', 'google-calendar'];

    public function up(): void
    {
        DB::table('integration_connections')->whereNotIn('integration_key', self::KEYS)->delete();
    }

    /**
     * Removed connections cannot be restored, so there is nothing to undo.
     */
    public function down(): void
    {
        //
    }
};
