<?php

namespace App\Cms\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * `php artisan addon:make {name}` — scaffold an addon folder that already
 * satisfies the manifest contract.
 */
class MakeAddonCommand extends Command
{
    protected $signature = 'addon:make {name : StudlyCase handle, e.g. PostCraft} {--force : Overwrite an existing folder}';

    protected $description = 'Scaffold a new addon folder';

    public function handle(): int
    {
        $handle = Str::studly((string) $this->argument('name'));
        $path = (string) config('lattice.paths.addons').'/'.$handle;

        if (File::exists($path) && ! $this->option('force')) {
            $this->components->error("Addon [{$handle}] already exists at {$path}.");

            return self::FAILURE;
        }

        $kebab = Str::kebab($handle);
        $namespace = "App\\Addons\\{$handle}";

        $files = [
            'addon.json' => $this->manifest($handle, $namespace),
            "{$handle}ServiceProvider.php" => $this->provider($handle, $kebab),
            'routes/admin.php' => $this->routes(),
            'routes/public.php' => "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\n// Public routes for {$handle}.\n",
            'database/migrations/.gitkeep' => '',
            'database/seeders/.gitkeep' => '',
            'Activator.php' => $this->activator($handle),
        ];

        foreach ($files as $relative => $contents) {
            $file = $path.'/'.$relative;
            File::ensureDirectoryExists(dirname($file));
            File::put($file, $contents);
        }

        $this->components->info("Addon [{$handle}] created at {$path}.");
        $this->line('Next: <fg=cyan>php artisan addon:enable '.$handle.'</>');

        return self::SUCCESS;
    }

    private function manifest(string $handle, string $namespace): string
    {
        return json_encode([
            'handle' => $handle,
            'name' => Str::headline($handle),
            'version' => '0.1.0',
            'description' => "The {$handle} addon.",
            'author' => 'Lattice',
            'provider' => $namespace.'\\'.$handle.'ServiceProvider',
            'requires' => [
                'php' => '^8.3',
                'laravel' => '^13.0',
                'lattice' => '^0.1',
            ],
            'permissions' => ["{$handle}:view"],
            'navigation' => [
                [
                    'section' => 'Content',
                    'label' => Str::headline($handle),
                    'route' => '/admin/'.Str::kebab($handle),
                    'icon' => 'plug',
                    'permission' => "{$handle}:view",
                    'order' => 60,
                ],
            ],
            'migrations' => true,
            'seeders' => [],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";
    }

    private function provider(string $handle, string $kebab): string
    {
        return <<<PHP
        <?php

        namespace App\\Addons\\{$handle};

        use Illuminate\\Support\\ServiceProvider;

        class {$handle}ServiceProvider extends ServiceProvider
        {
            public function boot(): void
            {
                if (is_file(__DIR__.'/routes/admin.php')) {
                    \$this->loadRoutesFrom(__DIR__.'/routes/admin.php');
                }

                if (is_file(__DIR__.'/routes/public.php')) {
                    \$this->loadRoutesFrom(__DIR__.'/routes/public.php');
                }

                \$this->loadViewsFrom(__DIR__.'/resources/views', '{$kebab}');
            }
        }

        PHP;
    }

    private function routes(): string
    {
        return <<<'PHP'
        <?php

        use Illuminate\Support\Facades\Route;

        Route::middleware(['web', 'auth'])->group(function (): void {
            // Addon admin routes live here.
        });

        PHP;
    }

    private function activator(string $handle): string
    {
        return <<<PHP
        <?php

        namespace App\\Addons\\{$handle};

        /**
         * Optional lifecycle hooks. Any method may be omitted.
         */
        class Activator
        {
            public function install(): void
            {
                //
            }

            public function activate(): void
            {
                //
            }

            public function deactivate(): void
            {
                //
            }

            public function uninstall(): void
            {
                //
            }
        }

        PHP;
    }
}
