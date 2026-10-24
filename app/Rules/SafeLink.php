<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Accepts only links that are safe to place in an `href`.
 *
 * Content is authored in the CMS but can also arrive from a seeder, an addon
 * or an import, so the scheme is checked at the boundary rather than trusted:
 * `javascript:`, `data:` and `vbscript:` URLs are rejected. Same-site relative
 * targets (`/about`, `#section`, `?page=2`) stay allowed.
 */
final class SafeLink implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || preg_match('~^(?:https?://[^\s]+|/[^\s]*|#[^\s]*|\?[^\s]*)$~i', trim($value)) !== 1) {
            $fail('The :attribute must be an http(s) URL or a same-site path.');
        }
    }
}
