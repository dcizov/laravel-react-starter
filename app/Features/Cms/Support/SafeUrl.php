<?php

namespace App\Features\Cms\Support;

use Closure;

/**
 * Allows http and https links, paths on this site such as /storage/a.png, and #anchors. Rejects javascript:,
 * data:, and protocol-relative links (//example.com), which could run code or leave the site.
 */
final class SafeUrl
{
    public static function rule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if ($value === null || $value === '') {
                return;
            }

            if (! is_string($value) || preg_match('#^(https?://[^\s]+|/(?!/)[^\s]*|\#[A-Za-z0-9_-]{0,80})$#i', $value) !== 1) {
                $fail(__('Use a full http or https link, or a path starting with /.'));
            }
        };
    }
}
