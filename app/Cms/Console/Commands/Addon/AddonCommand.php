<?php

namespace App\Cms\Console\Commands\Addon;

use App\Cms\Repositories\AddonRepository;
use Illuminate\Console\Command;

/**
 * Shared plumbing for the addon lifecycle commands.
 */
abstract class AddonCommand extends Command
{
    abstract protected function action(): string;

    public function handle(AddonRepository $addons): int
    {
        $handle = (string) $this->argument('handle');

        if ($addons->find($handle) === null) {
            $this->components->error("Addon [{$handle}] is not installed. Run lattice:install or restore its folder.");

            return self::FAILURE;
        }

        try {
            $this->perform($handle);
        } catch (\Throwable $e) {
            $this->components->error($e->getMessage());

            return self::FAILURE;
        }

        $this->components->info("Addon [{$handle}] {$this->action()}.");

        return self::SUCCESS;
    }

    abstract protected function perform(string $handle): void;
}
