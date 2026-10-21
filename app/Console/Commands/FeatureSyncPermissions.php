<?php

namespace App\Console\Commands;

use App\Support\Rbac;
use Illuminate\Console\Command;

class FeatureSyncPermissions extends Command
{
    protected $signature = 'feature:sync-permissions';

    protected $description = 'Give the admin role the permissions of the enabled features, and remove the others. Run by feature:enable and feature:disable';

    public function handle(): int
    {
        Rbac::syncFeaturePermissions();

        return self::SUCCESS;
    }
}
