<?php

use App\Addons\Discovery\AddonDiscovery;
use App\Addons\Exceptions\AddonManifestException;
use App\Addons\Manifest\ManifestValidator;
use Illuminate\Support\Str;

const FIXTURE_DIR = __DIR__.'/../../Fixtures/addons/lifecycle-fixture';

/** @return array<string, mixed> */
function fixtureManifest(): array
{
    return json_decode((string) file_get_contents(FIXTURE_DIR.'/addon.json'), true, 32, JSON_THROW_ON_ERROR);
}

function addonValidator(array $reservedSlugs = ['admin'], array $reservedPermissions = ['users.view'], string $core = '1.0.0'): ManifestValidator
{
    return new ManifestValidator($reservedSlugs, $reservedPermissions, $core);
}

it('accepts the lifecycle fixture manifest', function () {
    expect(addonValidator()->errors(fixtureManifest(), FIXTURE_DIR, 'lifecycle-fixture'))->toBe([]);
});

it('reports every problem in one pass instead of stopping at the first', function () {
    $data = fixtureManifest();
    $data['name'] = 'Not A Package';
    $data['version'] = 'v1';
    $data['core'] = '^2.0';
    $data['provides']['permissions'] = ['lifecycle-fixture.view', 'users.view', 'other.view'];
    $data['provides']['tables'] = ['items'];
    $data['provides']['cache'] = ['x'];
    $data['surprise'] = true;
    unset($data['label']);

    $errors = addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture');
    $text = implode("\n", $errors);

    expect($errors)->toHaveCount(11)
        ->and($text)->toContain('"name" must be a Composer-style package name')
        ->and($text)->toContain('"version" must be a semantic version')
        ->and($text)->toContain('"core" ^2.0 does not include')
        ->and($text)->toContain('Permission "other.view" must start with "lifecycle-fixture."')
        ->and($text)->toContain('Permission "users.view" is already used')
        ->and($text)->toContain('Table "items" must start with "lifecycle_fixture_"')
        ->and($text)->toContain('Unknown capability "cache"')
        ->and($text)->toContain('Unknown field "surprise"')
        ->and($text)->toContain('Missing required field "label"');
});

it('rejects a reserved slug and a folder name that does not match the slug', function () {
    $data = fixtureManifest();
    $data['slug'] = 'admin';
    $data['name'] = 'fixtures/admin';

    $text = implode("\n", addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture'));

    expect($text)->toContain('The slug "admin" is reserved')
        ->and($text)->toContain('must be named "admin"');
});

it('checks slug, package name, version and label formats', function (string $field, mixed $value, string $expected) {
    $data = fixtureManifest();
    $data[$field] = $value;

    expect(implode("\n", addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture')))->toContain($expected);
})->with([
    'slug with uppercase' => ['slug', 'Lifecycle', '"slug" must use lowercase'],
    'slug with underscore' => ['slug', 'life_cycle', '"slug" must use lowercase'],
    'name without a vendor' => ['name', 'lifecycle-fixture', '"name" must be a Composer-style'],
    'two-part version' => ['version', '1.0', '"version" must be a semantic version'],
    'empty label' => ['label', '   ', '"label" must be a non-empty string'],
]);

it('rejects invalid core and dependency constraints', function () {
    $data = fixtureManifest();
    $data['core'] = 'not a constraint';
    $data['requires'] = ['addons' => ['other-addon' => '>>1', 'Bad_Slug' => '^1.0', 'lifecycle-fixture' => '^1.0']];

    $text = implode("\n", addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture'));

    expect($text)->toContain('"core" "not a constraint" is not a valid version constraint')
        ->and($text)->toContain('"requires.addons.other-addon" ">>1" is not a valid version constraint')
        ->and($text)->toContain('invalid slug "Bad_Slug"')
        ->and($text)->toContain('An addon cannot require itself');
});

it('rejects table names outside the addon prefix or over the length limit', function () {
    $data = fixtureManifest();
    $data['provides']['tables'] = ['lifecycle_fixture_'.str_repeat('x', 60), 'lifecycle_fixture_items', 'lifecycle_fixture_items'];

    $text = implode("\n", addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture'));

    expect($text)->toContain('at most 63 characters')
        ->and($text)->toContain('is listed more than once');
});

it('keeps capability paths inside the addon folder', function () {
    $data = fixtureManifest();
    $data['provides']['routes'] = '../../secret.php';
    $data['provides']['migrations'] = 'database/does-not-exist';

    $text = implode("\n", addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture'));

    expect($text)->toContain('must stay inside the addon folder')
        ->and($text)->toContain('which is not a folder');
});

it('reports invalid JSON and missing files through discovery', function () {
    $root = sys_get_temp_dir().'/addons-unit-'.Str::random(10);
    mkdir($root.'/broken', 0775, true);
    file_put_contents($root.'/broken/addon.json', '{"slug": ');

    try {
        $discovery = new AddonDiscovery(addonValidator(), [$root]);
        $result = $discovery->discover();

        expect($result->manifests)->toBe([])
            ->and($result->errors[$root.'/broken/addon.json'][0])->toStartWith('Invalid JSON');

        expect(fn () => $discovery->readManifest($root.'/missing/addon.json'))
            ->toThrow(AddonManifestException::class, 'addon.json was not found.');
    } finally {
        unlink($root.'/broken/addon.json');
        rmdir($root.'/broken');
        rmdir($root);
    }
});

/** @return list<string> */
function writeAddonFolders(string $root, array $addons): array
{
    $folders = [];

    foreach ($addons as $slug => $requires) {
        $dir = $root.'/'.$slug;
        mkdir($dir, 0775, true);
        file_put_contents($dir.'/addon.json', json_encode([
            'name' => 'vendor/'.$slug,
            'slug' => $slug,
            'version' => '1.0.0',
            'label' => ucfirst($slug),
            'core' => '^1.0',
            'requires' => ['addons' => $requires],
        ], JSON_THROW_ON_ERROR));
        $folders[] = $dir;
    }

    return $folders;
}

function removeAddonFolders(array $folders): void
{
    foreach ($folders as $dir) {
        @unlink($dir.'/addon.json');
        @rmdir($dir);
    }
}

it('reports a slug that is defined in two addon folders', function () {
    $root = sys_get_temp_dir().'/addons-unit-'.Str::random(10);
    $other = sys_get_temp_dir().'/addons-unit-'.Str::random(10);
    $folders = [...writeAddonFolders($root, ['alpha' => []]), ...writeAddonFolders($other, ['alpha' => []])];

    try {
        $result = (new AddonDiscovery(addonValidator(), [$root, $other]))->discover();

        expect($result->manifests)->toBe([])
            ->and($result->errorsFor('alpha'))->toContain(
                'The slug "alpha" is defined in both '.$root.'/alpha/addon.json and '.$other.'/alpha/addon.json.',
            );
    } finally {
        removeAddonFolders($folders);
        @rmdir($root);
        @rmdir($other);
    }
});

it('reports a dependency cycle between addons', function () {
    $root = sys_get_temp_dir().'/addons-unit-'.Str::random(10);
    $folders = writeAddonFolders($root, ['alpha' => ['beta' => '^1.0'], 'beta' => ['alpha' => '^1.0']]);

    try {
        $result = (new AddonDiscovery(addonValidator(), [$root]))->discover();

        expect($result->manifests)->toHaveCount(2)
            ->and(implode("\n", $result->errorsFor('alpha')))->toContain('Dependency cycle: alpha -> beta -> alpha.');
    } finally {
        removeAddonFolders($folders);
        @rmdir($root);
    }
});

test('routes_mount accepts root and addon, rejects other values, and needs routes', function () {
    $data = fixtureManifest();
    $data['provides']['routes_mount'] = 'root';
    expect(addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture'))->toBe([]);

    $data['provides']['routes_mount'] = 'everywhere';
    expect(implode("\n", addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture')))
        ->toContain('"provides.routes_mount" must be "addon" or "root".');

    $data = fixtureManifest();
    unset($data['provides']['routes']);
    $data['provides']['routes_mount'] = 'root';
    expect(implode("\n", addonValidator()->errors($data, FIXTURE_DIR, 'lifecycle-fixture')))
        ->toContain('"provides.routes_mount" needs "provides.routes".');
});

/**
 * A copy of the lifecycle fixture manifest in a temporary folder named after its slug, with the given page files.
 * Returns the addon folder. Removed when the test process ends.
 *
 * @param  array<string, string>  $pageFiles  Page name (no extension) => file contents.
 */
function pagesAddonFixture(array $pageFiles = []): string
{
    $base = sys_get_temp_dir().'/addon-pages-'.Str::random(12);
    $dir = $base.'/lifecycle-fixture';

    mkdir($dir.'/resources/js/pages', 0777, true);

    foreach ($pageFiles as $page => $contents) {
        $path = $dir.'/resources/js/pages/'.$page.'.tsx';

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        file_put_contents($path, $contents);
    }

    register_shutdown_function(fn () => removePagesTree($base));

    return $dir;
}

function removePagesTree(string $path): void
{
    if (is_link($path) || is_file($path)) {
        @unlink($path);

        return;
    }

    if (! is_dir($path)) {
        return;
    }

    foreach (scandir($path) ?: [] as $entry) {
        if ($entry !== '.' && $entry !== '..') {
            removePagesTree($path.'/'.$entry);
        }
    }

    @rmdir($path);
}

/** @return array<string, mixed> */
function pagesManifest(array $pages): array
{
    $data = fixtureManifest();
    $data['provides']['pages'] = $pages;

    return $data;
}

it('accepts declared pages in both layouts, including a nested one', function () {
    $dir = pagesAddonFixture([
        'subscribe' => '',
        'admin/newsletter' => '',
    ]);

    $data = pagesManifest([
        ['page' => 'subscribe', 'layout' => 'public'],
        ['page' => 'admin/newsletter', 'layout' => 'app'],
    ]);

    expect(addonValidator()->errors($data, $dir, 'lifecycle-fixture'))->toBe([]);
});

it('treats a manifest without provides.pages as declaring no pages', function () {
    $dir = pagesAddonFixture(['subscribe' => '']);

    expect(addonValidator()->errors(fixtureManifest(), $dir, 'lifecycle-fixture'))->toBe([]);
});

it('rejects a declared page whose file is missing', function () {
    $dir = pagesAddonFixture();

    $text = implode("\n", addonValidator()->errors(pagesManifest([['page' => 'subscribe', 'layout' => 'public']]), $dir, 'lifecycle-fixture'));

    expect($text)->toContain('"provides.pages" declares "subscribe", but resources/js/pages/subscribe.tsx does not exist.');
});

it('rejects a layout other than public or app', function () {
    $dir = pagesAddonFixture(['subscribe' => '']);

    $text = implode("\n", addonValidator()->errors(pagesManifest([['page' => 'subscribe', 'layout' => 'admin']]), $dir, 'lifecycle-fixture'));

    expect($text)->toContain('"provides.pages[0].layout" must be "public" or "app".');
});

it('rejects a page name that escapes the pages folder or carries an extension', function (string $page) {
    $dir = pagesAddonFixture(['subscribe' => '']);

    $text = implode("\n", addonValidator()->errors(pagesManifest([['page' => $page, 'layout' => 'public']]), $dir, 'lifecycle-fixture'));

    expect($text)->toContain('"provides.pages[0].page" must be a page name without an extension');
})->with([
    'parent traversal' => ['../../secret'],
    'absolute path' => ['/etc/passwd'],
    'backslash' => ['admin\\newsletter'],
    'extension' => ['subscribe.tsx'],
    'empty segment' => ['admin//newsletter'],
    'dot segment' => ['./subscribe'],
]);

it('rejects a page declared twice in one addon', function () {
    $dir = pagesAddonFixture(['subscribe' => '']);

    $text = implode("\n", addonValidator()->errors(pagesManifest([
        ['page' => 'subscribe', 'layout' => 'public'],
        ['page' => 'subscribe', 'layout' => 'app'],
    ]), $dir, 'lifecycle-fixture'));

    expect($text)->toContain('Page "subscribe" is declared more than once in "provides.pages".');
});

it('rejects a page file that is a symlink leaving the pages folder', function () {
    $dir = pagesAddonFixture();
    $outside = dirname($dir).'/outside.tsx';
    file_put_contents($outside, '');
    symlink($outside, $dir.'/resources/js/pages/leak.tsx');

    $text = implode("\n", addonValidator()->errors(pagesManifest([['page' => 'leak', 'layout' => 'public']]), $dir, 'lifecycle-fixture'));

    expect($text)->toContain('"provides.pages" declares "leak", which resolves outside the addon\'s resources/js/pages folder.');
});

it('rejects a pages value that is not a list of page and layout objects', function () {
    $dir = pagesAddonFixture(['subscribe' => '']);

    $notAList = fixtureManifest();
    $notAList['provides']['pages'] = 'subscribe';

    $extraKey = pagesManifest([['page' => 'subscribe', 'layout' => 'public', 'mount' => '/x']]);

    expect(implode("\n", addonValidator()->errors($notAList, $dir, 'lifecycle-fixture')))
        ->toContain('"provides.pages" must be a list of {"page", "layout"} objects.')
        ->and(implode("\n", addonValidator()->errors($extraKey, $dir, 'lifecycle-fixture')))
        ->toContain('"provides.pages[0]" must have exactly a "page" and a "layout".');
});
