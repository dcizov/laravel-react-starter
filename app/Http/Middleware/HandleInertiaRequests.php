<?php

namespace App\Http\Middleware;

use App\Cms\Boot\ProviderLoader;
use App\Cms\Registries\Navigation;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * Heavy values are closures so they are only resolved when the client
     * actually needs them.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'app' => [
                'name' => config('app.name'),
                'version' => config('lattice.version'),
            ],
            'auth' => [
                'user' => $request->user(),
                'can' => [],
            ],
            'navigation' => fn (): array => $this->navigation($request),
            'flash' => [
                'toast' => fn (): ?array => $request->session()->get('toast'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * The sidebar is rendered from the registry: addon manifests and the core
     * config add items at boot; nothing is hardcoded in React.
     *
     * @return list<array{label: string, items: list<array<string, mixed>>}>
     */
    private function navigation(Request $request): array
    {
        if (! app(ProviderLoader::class)->installed()) {
            return [];
        }

        $grouped = app(Navigation::class)->grouped($request->user());
        $sections = [];

        foreach ($grouped as $section => $items) {
            $sections[] = [
                'label' => $section,
                'items' => array_map(fn (array $item): array => [
                    'label' => $item['label'],
                    'href' => $item['route'],
                    'route' => $item['route'],
                    'icon' => $item['icon'],
                    'permission' => $item['permission'],
                    'addon' => $item['addon'],
                ], $items),
            ];
        }

        return $sections;
    }
}
