<?php

namespace App\Addons\Manifest;

use Composer\Semver\Semver;
use Composer\Semver\VersionParser;
use Illuminate\Support\ServiceProvider;
use Throwable;

/**
 * Checks an addon.json and reports every problem it finds, not only the first. It reads no database and
 * changes nothing, so it can be used by discovery, the lifecycle and the tests alike.
 */
final class ManifestValidator
{
    /** Fields allowed at the top level of addon.json. */
    public const FIELDS = ['name', 'slug', 'version', 'label', 'core', 'provider', 'requires', 'provides'];

    /** Fields that must be present. */
    public const REQUIRED_FIELDS = ['name', 'slug', 'version', 'label', 'core'];

    /** Capabilities an addon may declare under "provides". */
    public const CAPABILITIES = ['routes', 'permissions', 'migrations', 'tables', 'config', 'translations', 'pages'];

    /**
     * Where an addon's routes are mounted. "addon" puts them under /addons/{slug}. "root" keeps the URLs the routes
     * already have, for an addon that replaces a built-in feature. Its routes still need the addon.active middleware.
     */
    public const ROUTE_MOUNTS = ['addon', 'root'];

    private const SLUG_PATTERN = '/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/';

    private const PACKAGE_PATTERN = '/^[a-z0-9]([_.-]?[a-z0-9]+)*\/[a-z0-9]([_.-]?[a-z0-9]+)*$/';

    private const SEMVER_PATTERN = '/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/';

    private const PERMISSION_ACTION_PATTERN = '/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/';

    private const CLASS_PATTERN = '/^[A-Za-z_]\w*(\\\\[A-Za-z_]\w*)*$/';

    private const TABLE_NAME_PATTERN = '/^[a-z][a-z0-9_]*$/';

    private const MAX_SLUG_LENGTH = 40;

    /** PostgreSQL's limit for identifiers. */
    private const MAX_TABLE_LENGTH = 63;

    /**
     * @param  list<string>  $reservedSlugs
     * @param  list<string>  $reservedPermissions
     */
    public function __construct(
        private readonly array $reservedSlugs,
        private readonly array $reservedPermissions,
        private readonly string $coreVersion,
    ) {}

    /**
     * @param  array<string, mixed>  $data  The decoded addon.json.
     * @param  string  $directory  The addon folder.
     * @param  string  $folder  The name of the addon folder, which must equal the slug.
     * @return list<string> Every problem found. Empty when the manifest is valid.
     */
    public function errors(array $data, string $directory, string $folder): array
    {
        $slug = is_string($data['slug'] ?? null) ? $data['slug'] : '';

        return [
            ...$this->fieldErrors($data),
            ...$this->checkSlug($data['slug'] ?? null, $folder),
            ...$this->checkName($data['name'] ?? null, $slug),
            ...$this->checkVersion($data['version'] ?? null),
            ...$this->checkLabel($data['label'] ?? null),
            ...$this->checkCore($data['core'] ?? null),
            ...$this->checkProvider($data['provider'] ?? null),
            ...$this->checkRequires($data['requires'] ?? null, $slug),
            ...$this->checkProvides($data['provides'] ?? null, $slug, $directory),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<string>
     */
    private function fieldErrors(array $data): array
    {
        $errors = [];

        foreach (array_diff(array_keys($data), self::FIELDS) as $unknown) {
            $errors[] = "Unknown field \"{$unknown}\".";
        }

        foreach (self::REQUIRED_FIELDS as $field) {
            if (! array_key_exists($field, $data)) {
                $errors[] = "Missing required field \"{$field}\".";
            }
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function checkSlug(mixed $slug, string $folder): array
    {
        if (! is_string($slug) || preg_match(self::SLUG_PATTERN, $slug) !== 1) {
            return ['"slug" must use lowercase letters, digits and single hyphens, and start with a letter, for example "lifecycle-fixture".'];
        }

        $errors = [];

        if (strlen($slug) > self::MAX_SLUG_LENGTH) {
            $errors[] = '"slug" must be at most '.self::MAX_SLUG_LENGTH.' characters.';
        }

        if (in_array($slug, $this->reservedSlugs, true)) {
            $errors[] = "The slug \"{$slug}\" is reserved. Choose another slug.";
        }

        if ($slug !== $folder) {
            $errors[] = "The addon folder must be named \"{$slug}\" to match the slug, but it is named \"{$folder}\".";
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function checkName(mixed $name, string $slug): array
    {
        if (! is_string($name) || preg_match(self::PACKAGE_PATTERN, $name) !== 1) {
            return ['"name" must be a Composer-style package name, for example "vendor/addon-name".'];
        }

        [, $package] = explode('/', $name, 2);

        if ($slug !== '' && $package !== $slug) {
            return ["The part of \"name\" after the slash must match the slug \"{$slug}\"."];
        }

        return [];
    }

    /**
     * @return list<string>
     */
    private function checkVersion(mixed $version): array
    {
        if (! is_string($version) || preg_match(self::SEMVER_PATTERN, $version) !== 1) {
            return ['"version" must be a semantic version, for example "1.2.0".'];
        }

        try {
            (new VersionParser)->normalize($version);
        } catch (Throwable) {
            return ['"version" is not a valid semantic version.'];
        }

        return [];
    }

    /**
     * @return list<string>
     */
    private function checkLabel(mixed $label): array
    {
        if (! is_string($label) || trim($label) === '' || mb_strlen($label) > 120) {
            return ['"label" must be a non-empty string of at most 120 characters.'];
        }

        return [];
    }

    /**
     * @return list<string>
     */
    private function checkCore(mixed $core): array
    {
        $problem = $this->constraintProblem($core);

        if ($problem !== null) {
            return ['"core" '.$problem];
        }

        try {
            $satisfied = Semver::satisfies($this->coreVersion, (string) $core);
        } catch (Throwable) {
            return ['"core" "'.$core.'" could not be checked against the core version.'];
        }

        if (! $satisfied) {
            return ["\"core\" {$core} does not include this application's core version {$this->coreVersion}."];
        }

        return [];
    }

    /**
     * @return list<string>
     */
    private function checkProvider(mixed $provider): array
    {
        if ($provider === null) {
            return [];
        }

        if (! is_string($provider) || preg_match(self::CLASS_PATTERN, $provider) !== 1) {
            return ['"provider" must be a fully qualified class name.'];
        }

        if (! class_exists($provider)) {
            return ["The \"provider\" class {$provider} could not be found. Check its namespace and autoloading."];
        }

        if (! is_subclass_of($provider, ServiceProvider::class)) {
            return ["The \"provider\" class {$provider} must extend Illuminate's ServiceProvider."];
        }

        return [];
    }

    /**
     * @return list<string>
     */
    private function checkRequires(mixed $requires, string $slug): array
    {
        if ($requires === null) {
            return [];
        }

        if (! is_array($requires)) {
            return ['"requires" must be an object.'];
        }

        $errors = [];

        foreach (array_diff(array_keys($requires), ['addons']) as $key) {
            $errors[] = "\"requires\" only supports \"addons\", not \"{$key}\".";
        }

        $addons = $requires['addons'] ?? [];

        if (! is_array($addons)) {
            return [...$errors, '"requires.addons" must be an object that maps addon slugs to version constraints.'];
        }

        foreach ($addons as $dependency => $constraint) {
            if (! is_string($dependency) || preg_match(self::SLUG_PATTERN, $dependency) !== 1) {
                $errors[] = "\"requires.addons\" has an invalid slug \"{$dependency}\".";

                continue;
            }

            if ($dependency === $slug) {
                $errors[] = 'An addon cannot require itself.';

                continue;
            }

            $problem = $this->constraintProblem($constraint);

            if ($problem !== null) {
                $errors[] = "\"requires.addons.{$dependency}\" {$problem}";
            }
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function checkProvides(mixed $provides, string $slug, string $directory): array
    {
        if ($provides === null) {
            return [];
        }

        if (! is_array($provides)) {
            return ['"provides" must be an object.'];
        }

        $errors = [];

        foreach (array_diff(array_keys($provides), [...self::CAPABILITIES, 'routes_mount']) as $unknown) {
            $errors[] = "Unknown capability \"{$unknown}\". Allowed capabilities: ".implode(', ', self::CAPABILITIES).'.';
        }

        $errors = [
            ...$errors,
            ...$this->checkPermissions($provides['permissions'] ?? null, $slug),
            ...$this->checkTables($provides['tables'] ?? null, $slug),
            ...$this->checkPages($provides['pages'] ?? null, $directory),
        ];

        foreach (['routes' => 'file', 'config' => 'file', 'migrations' => 'directory', 'translations' => 'directory'] as $key => $kind) {
            if (array_key_exists($key, $provides)) {
                $errors = [...$errors, ...$this->checkPath($key, $provides[$key], $directory, $kind)];
            }
        }

        if (array_key_exists('routes_mount', $provides)) {
            if (! in_array($provides['routes_mount'], self::ROUTE_MOUNTS, true)) {
                $errors[] = '"provides.routes_mount" must be "addon" or "root".';
            } elseif (! array_key_exists('routes', $provides)) {
                $errors[] = '"provides.routes_mount" needs "provides.routes".';
            }
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function checkPermissions(mixed $permissions, string $slug): array
    {
        if ($permissions === null) {
            return [];
        }

        if (! is_array($permissions) || ! array_is_list($permissions)) {
            return ['"provides.permissions" must be a list of permission names.'];
        }

        $errors = [];
        $seen = [];

        foreach ($permissions as $permission) {
            if (! is_string($permission)) {
                $errors[] = '"provides.permissions" entries must be strings.';

                continue;
            }

            // Report a reserved clash even when the name is also malformed, so one pass shows every problem.
            if (in_array($permission, $this->reservedPermissions, true)) {
                $errors[] = "Permission \"{$permission}\" is already used by the app or a feature.";
            }

            $action = $slug !== '' && str_starts_with($permission, $slug.'.')
                ? substr($permission, strlen($slug) + 1)
                : null;

            if ($action === null || preg_match(self::PERMISSION_ACTION_PATTERN, $action) !== 1) {
                $errors[] = "Permission \"{$permission}\" must start with \"{$slug}.\" followed by an action, for example \"{$slug}.view\".";

                continue;
            }

            if (in_array($permission, $seen, true)) {
                $errors[] = "Permission \"{$permission}\" is listed more than once.";
            }

            $seen[] = $permission;
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function checkTables(mixed $tables, string $slug): array
    {
        if ($tables === null) {
            return [];
        }

        if (! is_array($tables) || ! array_is_list($tables)) {
            return ['"provides.tables" must be a list of table names.'];
        }

        $prefix = str_replace('-', '_', $slug).'_';
        $errors = [];
        $seen = [];

        foreach ($tables as $table) {
            if (! is_string($table)
                || ! str_starts_with($table, $prefix)
                || preg_match(self::TABLE_NAME_PATTERN, $table) !== 1
                || strlen($table) > self::MAX_TABLE_LENGTH) {
                $errors[] = 'Table "'.(is_string($table) ? $table : '?')."\" must start with \"{$prefix}\", use lowercase letters, digits and underscores, and be at most ".self::MAX_TABLE_LENGTH.' characters.';

                continue;
            }

            if (in_array($table, $seen, true)) {
                $errors[] = "Table \"{$table}\" is listed more than once.";
            }

            $seen[] = $table;
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function checkPath(string $key, mixed $relative, string $directory, string $kind): array
    {
        if (! is_string($relative) || $relative === '') {
            return ["\"provides.{$key}\" must be a relative path."];
        }

        if (str_starts_with($relative, '/') || str_contains($relative, '\\') || in_array('..', explode('/', $relative), true)) {
            return ["\"provides.{$key}\" must stay inside the addon folder."];
        }

        if ($key === 'routes' && ! str_ends_with($relative, '.php')) {
            return ['"provides.routes" must point to a PHP file.'];
        }

        $path = rtrim($directory, '/').'/'.$relative;

        if ($kind === 'file' && ! is_file($path)) {
            return ["\"provides.{$key}\" points to {$relative}, which does not exist."];
        }

        if ($kind === 'directory' && ! is_dir($path)) {
            return ["\"provides.{$key}\" points to {$relative}, which is not a folder."];
        }

        return [];
    }

    /**
     * Each entry of provides.pages names a page file, with the layout it is shown in. The name is checked as text
     * first, then the file is resolved: realpath() follows symlinks, so a link that leaves the pages folder is refused
     * even though its name is plain. Undeclared files are not an error here; AddonCompiler warns about them.
     *
     * @return list<string>
     */
    private function checkPages(mixed $pages, string $directory): array
    {
        if ($pages === null) {
            return [];
        }

        if (! is_array($pages) || ! array_is_list($pages)) {
            return ['"provides.pages" must be a list of {"page", "layout"} objects.'];
        }

        $errors = [];
        $declared = [];
        $root = rtrim($directory, '/').'/'.AddonPages::ROOT;
        $realRoot = is_dir($root) ? realpath($root) : false;

        foreach ($pages as $index => $entry) {
            $where = "provides.pages[{$index}]";

            if (! is_array($entry)
                || array_diff(array_keys($entry), ['page', 'layout', 'url']) !== []
                || ! array_key_exists('page', $entry)
                || ! array_key_exists('layout', $entry)) {
                $errors[] = "\"{$where}\" must have a \"page\" and a \"layout\", and may have a \"url\".";

                continue;
            }

            $page = $entry['page'];

            if (! is_string($page) || preg_match(AddonPages::PAGE_PATTERN, $page) !== 1) {
                $errors[] = "\"{$where}.page\" must be a page name without an extension, such as \"subscribe\" or \"admin/index\". Use letters, digits, hyphens and underscores, with \"/\" between folders.";

                continue;
            }

            if (! in_array($entry['layout'], AddonPages::LAYOUTS, true)) {
                $errors[] = "\"{$where}.layout\" must be \"public\" or \"app\".";
            }

            if (array_key_exists('url', $entry)
                && (! is_string($entry['url']) || preg_match(AddonPages::URL_PATTERN, $entry['url']) !== 1)) {
                $errors[] = "\"{$where}.url\" must be a static path that starts with \"/\", such as \"/newsletter\". Use letters, digits, hyphens and underscores, with \"/\" between segments.";
            }

            if (in_array($page, $declared, true)) {
                $errors[] = "Page \"{$page}\" is declared more than once in \"provides.pages\".";
            }

            $declared[] = $page;

            if ($realRoot === false) {
                $errors[] = '"provides.pages" declares "'.$page.'", but '.AddonPages::ROOT.' does not exist.';

                continue;
            }

            $file = $root.'/'.$page.'.tsx';

            if (! is_file($file)) {
                $errors[] = '"provides.pages" declares "'.$page.'", but '.AddonPages::ROOT.'/'.$page.'.tsx does not exist.';

                continue;
            }

            $real = realpath($file);

            if ($real === false || ! str_starts_with($real, $realRoot.DIRECTORY_SEPARATOR)) {
                $errors[] = '"provides.pages" declares "'.$page.'", which resolves outside the addon\'s '.AddonPages::ROOT.' folder.';
            }
        }

        return $errors;
    }

    /**
     * A version constraint problem, or null when the constraint is valid.
     */
    private function constraintProblem(mixed $constraint): ?string
    {
        if (! is_string($constraint) || trim($constraint) === '') {
            return 'must be a version constraint, for example "^1.0".';
        }

        try {
            (new VersionParser)->parseConstraints($constraint);
        } catch (Throwable) {
            return "\"{$constraint}\" is not a valid version constraint.";
        }

        return null;
    }
}
