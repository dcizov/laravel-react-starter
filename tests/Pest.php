<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Feature tests run inside a transaction. The CMS lifecycle tests boot the
| application more than once (that is the point of the boot contract), which
| needs a committed database — they use DatabaseMigrations on the file
| database in database/testing.sqlite instead.
|
*/

/*
|--------------------------------------------------------------------------
| Test database
|--------------------------------------------------------------------------
|
| `phpunit.xml` pins the suite to SQLite so `sail artisan test` works whatever
| the application's `.env` points at (Postgres under Sail, SQLite without it).
| The file is gitignored, so a fresh clone has to create it once.
|
*/

$testingDatabase = dirname(__DIR__).'/database/testing.sqlite';

if (! file_exists($testingDatabase)) {
    touch($testingDatabase);
}

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature/Auth', 'Feature/Settings', 'Feature/Http', 'Feature/Admin', 'Feature/Pages', 'Feature/Media', 'Feature/Themes');

pest()->extend(TestCase::class)
    ->use(DatabaseMigrations::class)
    ->in('Feature/Cms', 'Feature/Addons');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});
