<?php

namespace App\Addons\Manifest;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * The pages an addon declares under "provides.pages", and the rules for them.
 *
 * A page is named "<addon slug>::<page>", for example "newsletter::subscribe". The slug prefix is what keeps two
 * addons from declaring the same name, so no separate uniqueness check across addons is needed.
 */
final class AddonPages
{
    /** The folder a page file lives in, relative to the addon folder. */
    public const ROOT = 'resources/js/pages';

    /** Public pages have no app shell. App pages use the admin shell. */
    public const LAYOUTS = ['public', 'app'];

    /**
     * A page name without its extension: letters, digits, hyphens and underscores, with single slashes between folders.
     * It rejects dots, so "..", absolute paths and "subscribe.tsx" are all refused before any file is looked at.
     */
    public const PAGE_PATTERN = '/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/';

    /**
     * The page files in an addon that no provides.pages entry declares, relative to the addon folder. These are
     * reported as warnings, not errors: an addon may ship a page it does not want mounted.
     *
     * @param  list<string>  $declared  Page names from provides.pages.
     * @return list<string>  Paths such as "resources/js/pages/admin/extra.tsx".
     */
    public static function undeclared(string $directory, array $declared): array
    {
        $root = rtrim($directory, '/').'/'.self::ROOT;

        if (! is_dir($root)) {
            return [];
        }

        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
        );

        $undeclared = [];

        foreach ($files as $file) {
            if (! $file->isFile() || ! str_ends_with($file->getFilename(), '.tsx')) {
                continue;
            }

            $relative = str_replace(DIRECTORY_SEPARATOR, '/', substr($file->getPathname(), strlen($root) + 1));
            $page = substr($relative, 0, -strlen('.tsx'));

            if (! in_array($page, $declared, true)) {
                $undeclared[] = self::ROOT.'/'.$relative;
            }
        }

        sort($undeclared);

        return $undeclared;
    }
}
