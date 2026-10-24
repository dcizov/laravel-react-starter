<?php

declare(strict_types=1);

namespace App\Cms\Support;

/**
 * A deliberately small subset of Composer's version constraint syntax.
 *
 * Supported: `*`, exact versions, `^`, `~`, wildcards (`1.2.*`), and the
 * comparison operators `>=`, `>`, `<=`, `<`. Alternatives may be separated
 * with `||`; conjunctions with `,` or whitespace.
 */
final class VersionConstraint
{
    public static function satisfies(string $version, ?string $constraints): bool
    {
        $constraints = trim((string) $constraints);

        if ($constraints === '' || $constraints === '*') {
            return true;
        }

        $version = self::normalize($version);

        foreach (preg_split('/\s*\|\|\s*/', $constraints) ?: [] as $alternative) {
            if (self::matchesAll($version, $alternative)) {
                return true;
            }
        }

        return false;
    }

    private static function matchesAll(string $version, string $constraints): bool
    {
        $parts = preg_split('/[\s,]+/', trim($constraints), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($parts === []) {
            return true;
        }

        foreach ($parts as $part) {
            if (! self::matches($version, $part)) {
                return false;
            }
        }

        return true;
    }

    private static function matches(string $version, string $constraint): bool
    {
        if ($constraint === '*' || $constraint === '') {
            return true;
        }

        if (str_starts_with($constraint, '^')) {
            return self::caret($version, substr($constraint, 1));
        }

        if (str_starts_with($constraint, '~')) {
            return self::tilde($version, substr($constraint, 1));
        }

        foreach (['>=', '<=', '>', '<'] as $operator) {
            if (str_starts_with($constraint, $operator)) {
                return version_compare($version, self::normalize(substr($constraint, strlen($operator))), $operator);
            }
        }

        if (str_ends_with($constraint, '.*')) {
            $prefix = substr($constraint, 0, -1);

            return str_starts_with($version.'', $prefix) || version_compare($version, substr($constraint, 0, -2), '>=');
        }

        return version_compare($version, self::normalize($constraint), '==');
    }

    /**
     * `^1.2.3` allows `>=1.2.3 <2.0.0`; `^0.2.3` allows `>=0.2.3 <0.3.0`.
     */
    private static function caret(string $version, string $target): bool
    {
        $target = self::normalize($target);

        if (! version_compare($version, $target, '>=')) {
            return false;
        }

        $segments = array_map('intval', explode('.', $target));
        $major = $segments[0] ?? 0;
        $minor = $segments[1] ?? 0;

        $upper = $major > 0
            ? ($major + 1).'.0.0'
            : ($minor > 0 ? '0.'.($minor + 1).'.0' : '0.0.'.(($segments[2] ?? 0) + 1));

        return version_compare($version, $upper, '<');
    }

    /**
     * `~1.2` allows `>=1.2 <2.0`; `~1.2.3` allows `>=1.2.3 <1.3.0`.
     */
    private static function tilde(string $version, string $target): bool
    {
        $target = self::normalize($target);

        if (! version_compare($version, $target, '>=')) {
            return false;
        }

        $segments = explode('.', $target);

        $upper = count($segments) >= 3
            ? $segments[0].'.'.((int) $segments[1] + 1).'.0'
            : ((int) $segments[0] + 1).'.0.0';

        return version_compare($version, $upper, '<');
    }

    private static function normalize(string $version): string
    {
        $version = ltrim(trim($version), 'vV');

        return $version === '' ? '0.0.0' : $version;
    }
}
