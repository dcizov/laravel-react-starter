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

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature/Auth', 'Feature/Settings', 'Feature/Http', 'Feature/Admin', 'Feature/Pages', 'Feature/Media', 'Feature/Themes', 'Feature/Addons');

pest()->extend(TestCase::class)
    ->use(DatabaseMigrations::class)
    ->in('Feature/Cms');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});
