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

        $problems += $this->frontend();

        return $this->summary($problems);
    }

    /**
     * Which JavaScript the browser is actually loading.
     *
     * A stale `public/build` is invisible otherwise: the page renders, just with
     * an older UI than the source on disk — the classic "my fix isn't there".
     */
    private function frontend(): int
    {
        $hot = public_path('hot');
        $manifest = public_path('build/manifest.json');

        if (File::exists($hot)) {
            $url = trim((string) File::get($hot));
            $this->twoColumn('Frontend assets', '<fg=yellow>dev server</> '.$url);

            return 0;
        }

        if (! File::exists($manifest)) {
            $this->twoColumn('Frontend assets', '<fg=red>not built (run npm run build)</>');

            return 1;
        }

        $built = File::lastModified($manifest);
        $newest = 0;

        foreach (['js', 'css'] as $dir) {
            foreach (File::allFiles(resource_path($dir)) as $file) {
                $newest = max($newest, $file->getMTime());
            }
        }

        if ($newest > $built) {
            $this->twoColumn(
                'Frontend assets',
                '<fg=yellow>stale (sources changed after the build — run npm run build)</>',
            );

            return 0;
        }

        $this->twoColumn('Frontend assets', '<fg=green>built</> '.date('Y-m-d H:i', $built));

        return 0;
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
