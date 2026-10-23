<?php

namespace App\Addons;

use App\Addons\Manifest\AddonManifest;
use App\Models\Addon;

/**
 * What addons:update found, or did. It is built before anything is written, so a dry run and a refusal see the same
 * plan that an applied update would use.
 */
final readonly class AddonUpdate
{
    /**
     * @param  list<string>  $changes  One line per change, for the operator.
     */
    public function __construct(
        public Addon $addon,
        public AddonManifest $manifest,
        public string $fromVersion,
        public array $changes,
        public bool $unchanged,
        public bool $downgrade,
        public bool $applied = false,
    ) {}
}
