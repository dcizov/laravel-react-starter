<?php

namespace App\Addons\Exceptions;

use RuntimeException;

/**
 * Base class for the problems the addon system reports. Its message is written for the person running the command.
 */
class AddonException extends RuntimeException {}
