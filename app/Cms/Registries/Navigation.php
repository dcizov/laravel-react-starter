<?php

namespace App\Cms\Registries;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Gate;

/**
 * The navigation registry.
 *
 * Extensions and the core add items at boot; the admin sidebar is rendered
 * from `all()` and never hardcodes a single link. Items are filtered by the
 * ability map of the current user.
 */
final class Navigation
{
    /** @var list<array{section: string, label: string, route: string, icon: string|null, permission: string|null, order: int, addon: string|null}> */
    private array $items = [];

    /**
     * @param  array{section: string, label: string, route: string, icon?: string|null, permission?: string|null, order?: int, addon?: string|null}  $item
     */
    public function add(array $item): void
    {
        $this->items[] = [
            'section' => $item['section'],
            'label' => $item['label'],
            'route' => $item['route'],
            'icon' => $item['icon'] ?? null,
            'permission' => $item['permission'] ?? null,
            'order' => (int) ($item['order'] ?? 100),
            'addon' => $item['addon'] ?? null,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    public function addMany(array $items): void
    {
        foreach ($items as $item) {
            $this->add($item);
        }
    }

    /**
     * All registered items, grouped by section and sorted by order.
     *
     * @return array<string, list<array<string, mixed>>>
     */
    public function grouped(?Authenticatable $user = null): array
    {
        $items = $this->filterFor($user);

        usort($items, fn (array $a, array $b): int => [$a['section'], $a['order'], $a['label']] <=> [$b['section'], $b['order'], $b['label']]);

        $grouped = [];

        foreach ($items as $item) {
            $grouped[$item['section']][] = $item;
        }

        return $grouped;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function all(?Authenticatable $user = null): array
    {
        return array_values(array_merge([], ...array_values($this->grouped($user))));
    }

    /**
     * Every registered item, unfiltered. Used by commands, tests and the
     * generator; never sent to the browser.
     *
     * @return list<array<string, mixed>>
     */
    public function raw(): array
    {
        return $this->items;
    }

    public function flush(): void
    {
        $this->items = [];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function filterFor(?Authenticatable $user): array
    {
        return array_values(array_filter(
            $this->items,
            static function (array $item) use ($user): bool {
                if ($item['permission'] === null || $user === null) {
                    return $item['permission'] === null;
                }

                return Gate::forUser($user)->allows($item['permission']);
            },
        ));
    }
}
