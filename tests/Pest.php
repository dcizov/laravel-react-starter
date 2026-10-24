<?php

declare(strict_types=1);

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
| The suite runs against whatever driver the environment names, so CI can
| exercise Postgres (`DB_CONNECTION=pgsql`) next to SQLite. When nothing is
| configured — a plain `sail artisan test`, or a clone with no .env — it falls
| back to the file database in database/testing.sqlite, which it creates once.
|
*/

$testingDatabase = dirname(__DIR__).'/database/testing.sqlite';

if (! file_exists($testingDatabase)) {
    touch($testingDatabase);
}

$connection = getenv('DB_CONNECTION');
$database = getenv('DB_DATABASE');

if ($connection === false || $connection === '') {
    $connection = 'sqlite';
}

if ($connection === 'sqlite' && ($database === false || $database === '' || $database === 'database/testing.sqlite')) {
    $database = $testingDatabase;
}

putenv('DB_CONNECTION='.$connection);
putenv('DB_DATABASE='.$database);
$_ENV['DB_CONNECTION'] = $_SERVER['DB_CONNECTION'] = $connection;
$_ENV['DB_DATABASE'] = $_SERVER['DB_DATABASE'] = $database;

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
