<?php

namespace App\Cms\Console\Commands;

use App\Cms\Repositories\AddonRepository;
use App\Cms\Repositories\ThemeRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * `php artisan lattice:doctor` — prints the boot contract's health.
 * Exits non-zero when something is broken, so CI can gate on it.
 */
class DoctorCommand extends Command
{
    protected $signature = 'lattice:doctor';

    protected $description = 'Check the Lattice installation and report problems';

    public function handle(AddonRepository $addons, ThemeRepository $themes): int
    {
        $problems = 0;

        $this->components->info('Lattice doctor');

        $this->line('PHP:      '.PHP_VERSION);
        $this->line('Laravel:  '.$this->laravel->version());
        $this->line('Lattice:  '.config('lattice.version'));

        $migrated = $this->laravel['db']->connection()->getSchemaBuilder()->hasTable('addons');

        $this->twoColumn('Core tables', $migrated ? '<fg=green>ok</>' : '<fg=red>missing (run lattice:install)</>');
        $problems += $migrated ? 0 : 1;

        if (! $migrated) {
            return $this->summary($problems);
        }

        $this->line('');

        foreach ($addons->installed() as $row) {
            $detail = match ($row->status) {
                'active' => '<fg=green>active</>',
                'inactive' => '<fg=yellow>inactive</>',
                default => '<fg=red>'.$row->status.': '.$row->last_error.'</>',
            };

            $this->twoColumn($row->handle.' '.$row->version, $detail);
            $problems += $row->status === 'error' ? 1 : 0;
        }

        $active = $themes->active();
        $this->twoColumn('Active theme', $active === null ? '<fg=yellow>none</>' : '<fg=green>'.$active->handle.'</>');

        foreach ($themes->installed() as $row) {
            if ($row->last_error !== null) {
                $this->twoColumn($row->handle, '<fg=red>'.$row->last_error.'</>');
                $problems++;
            }
        }

        $storage = public_path('storage');
        $this->twoColumn('Storage link', File::exists($storage) ? '<fg=green>ok</>' : '<fg=yellow>missing (run storage:link)</>');

        return $this->summary($problems);
    }

    private function twoColumn(string $label, string $value): void
    {
        $this->components->twoColumnDetail($label, $value);
    }

    private function summary(int $problems): int
    {
        $this->line('');

        if ($problems > 0) {
            $this->components->error("{$problems} problem(s) found.");

            return self::FAILURE;
        }

        $this->components->info('No problems found.');

        return self::SUCCESS;
    }
}
