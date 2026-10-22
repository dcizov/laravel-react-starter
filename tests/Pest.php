<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Addons\AddonSandbox;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Addon isolation
|--------------------------------------------------------------------------
|
| The app reads its compiled addon manifest at boot. Point the suite at a manifest that does not exist, so
| the addons a developer has enabled locally never leak into a test. A test that needs an addon creates its
| own sandbox with AddonSandbox, which is the only way addons are active in the suite.
|
*/

$addonTestRoot = sys_get_temp_dir().'/addons-test-none-'.getmypid();
putenv('ADDONS_MANIFEST_PATH='.$addonTestRoot.'/cache/addons.php');
putenv('ADDONS_LAST_GOOD_PATH='.$addonTestRoot.'/cache/addons.last-good.php');

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Install and activate the repository's newsletter addon for this test, and register its routes. The temporary
 * addon root is removed when the test process ends.
 */
function activateNewsletterAddon(): void
{
    $root = AddonSandbox::activateRepositoryAddon('newsletter');

    register_shutdown_function(fn () => AddonSandbox::destroy($root));
}
