<?php

namespace App\Support\Dashboard;

use Closure;
use InvalidArgumentException;
use LogicException;

/**
 * Lets optional modules add a card to the dashboard's site overview without the core knowing about them.
 *
 * A contributor registers a key, the name of the module that owns it, the permission that lets a user see the
 * card, an optional visibility check, and a closure that returns the card's data. The core dashboard calls
 * collect() and merges the result into the overview. Rules:
 *  - a key can be registered once. A second registration fails at registration time and names both owners;
 *  - a card is computed only when its visibility check passes and the user holds its permission. Its query never
 *    runs otherwise, so an absent or inactive module costs nothing;
 *  - cards are returned in order of priority (lower first), then by key, so the result is deterministic and does
 *    not depend on which provider booted first;
 *  - a key that the core already uses in the overview is rejected when the overview is collected.
 *
 * Plain PHP with no framework dependency, so the rules can be tested without booting the application.
 */
final class DashboardCards
{
    public const DEFAULT_PRIORITY = 100;

    /** @var array<string, array{owner: string, permission: string, priority: int, visible: ?Closure, card: Closure}> */
    private array $cards = [];

    /**
     * @param  ?Closure(): bool  $visible  Answers whether the card may be shown at all, for example that its module is active.
     */
    public function register(
        string $key,
        string $owner,
        string $permission,
        Closure $card,
        int $priority = self::DEFAULT_PRIORITY,
        ?Closure $visible = null,
    ): void {
        if (! preg_match('/^[a-z][a-z0-9_]*$/', $key)) {
            throw new InvalidArgumentException("Dashboard card key [{$key}] must be lower snake case.");
        }

        if (trim($owner) === '') {
            throw new InvalidArgumentException("Dashboard card [{$key}] must name the module that owns it.");
        }

        if ($permission === '') {
            throw new InvalidArgumentException("Dashboard card [{$key}] needs a permission.");
        }

        if (isset($this->cards[$key])) {
            throw new LogicException(
                "Dashboard card [{$key}] is already registered by [{$this->cards[$key]['owner']}]; [{$owner}] cannot register it again.",
            );
        }

        $this->cards[$key] = [
            'owner' => $owner,
            'permission' => $permission,
            'priority' => $priority,
            'visible' => $visible,
            'card' => $card,
        ];
    }

    public function has(string $key): bool
    {
        return isset($this->cards[$key]);
    }

    /**
     * Returns the data of every card the user may see, keyed by card key, in priority order.
     *
     * @param  callable(string): bool  $can  Answers whether the user holds a permission.
     * @param  array<string, mixed>  $taken  Keys the core has already placed in the overview.
     * @return array<string, mixed>
     */
    public function collect(callable $can, array $taken = []): array
    {
        $ordered = $this->cards;

        uksort($ordered, fn (string $a, string $b): int => [$this->cards[$a]['priority'], $a]
            <=> [$this->cards[$b]['priority'], $b]);

        $collected = [];

        foreach ($ordered as $key => $entry) {
            if ($entry['visible'] !== null && ($entry['visible'])() !== true) {
                continue;
            }

            if (! $can($entry['permission'])) {
                continue;
            }

            if (array_key_exists($key, $taken)) {
                throw new LogicException("Dashboard card [{$key}] clashes with a core overview key.");
            }

            $collected[$key] = ($entry['card'])();
        }

        return $collected;
    }
}
