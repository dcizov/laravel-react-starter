<?php

namespace App\Addons\Events;

/**
 * Sent just before the compiled addon manifest is written. Nothing is written if a listener throws, and the
 * lifecycle restores the previous manifest. Listeners may check the state but must not change it.
 */
final readonly class AddonManifestCompiling
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(public array $payload) {}
}
