<?php

declare(strict_types=1);

namespace App\Addons\Shopper;

use Illuminate\Support\ServiceProvider;

/**
 * This provider is unreachable in practice: the manifest requires Lattice ^2.0
 * and an addon called Payments, so installation is refused before any of this
 * boots. It exists so the refusal has something concrete to point at.
 */
class ShopperServiceProvider extends ServiceProvider {}
