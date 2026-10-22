<?php

namespace App\Addons\Exceptions;

/**
 * An addon.json that could not be read or did not pass validation. Carries every problem found.
 */
final class AddonManifestException extends AddonException
{
    /**
     * @param  list<string>  $errors
     */
    public function __construct(public readonly string $manifestPath, public readonly array $errors)
    {
        parent::__construct($manifestPath.': '.implode(' ', $errors));
    }
}
