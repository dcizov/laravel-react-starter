<?php

declare(strict_types=1);

namespace App\Themes\Meridian;

use Illuminate\Support\ServiceProvider;

/**
 * Theme B is a token variant: it ships no sections of its own and no separate
 * components, it re-reads the same React tree with different tokens. The
 * provider exists because the boot contract registers a provider per theme —
 * today it only proves the theme booted.
 */
class MeridianServiceProvider extends ServiceProvider {}
