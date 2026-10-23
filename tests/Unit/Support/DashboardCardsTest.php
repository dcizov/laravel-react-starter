<?php

use App\Support\Dashboard\DashboardCards;

// The registry is plain PHP, so these tests need no database and no booted application.

test('cards are collected by priority, then by key, whatever the registration order', function () {
    $cards = new DashboardCards;
    $card = fn () => [];

    $cards->register('zeta', 'mod-a', 'p.view', $card, 50);
    $cards->register('beta', 'mod-b', 'p.view', $card, 10);
    $cards->register('alpha', 'mod-c', 'p.view', $card, 10);

    expect(array_keys($cards->collect(fn () => true)))->toBe(['alpha', 'beta', 'zeta']);
});

test('a second registration of the same key throws and names both owners', function () {
    $cards = new DashboardCards;
    $card = fn () => [];

    $cards->register('newsletter', 'newsletter', 'newsletter.manage', $card);

    expect(fn () => $cards->register('newsletter', 'other-addon', 'newsletter.manage', $card))
        ->toThrow(LogicException::class, 'already registered by [newsletter]; [other-addon] cannot register it again.');
});

test('a card the user may not see is left out and its data is never computed', function () {
    $cards = new DashboardCards;
    $computed = 0;

    $cards->register('newsletter', 'newsletter', 'newsletter.manage', function () use (&$computed) {
        $computed++;

        return ['subscribed' => 3];
    });

    expect($cards->collect(fn (string $permission) => false))->toBe([])
        ->and($computed)->toBe(0);
});

test('a card whose visibility check fails is left out even for a user with its permission', function () {
    $cards = new DashboardCards;
    $computed = 0;

    $cards->register(
        'newsletter',
        'newsletter',
        'newsletter.manage',
        function () use (&$computed) {
            $computed++;

            return ['subscribed' => 3];
        },
        visible: fn () => false,
    );

    expect($cards->collect(fn () => true))->toBe([])
        ->and($computed)->toBe(0);
});

test('a visible card the user may see is computed and returned under its key', function () {
    $cards = new DashboardCards;

    $cards->register('newsletter', 'newsletter', 'newsletter.manage', fn () => ['subscribed' => 3], visible: fn () => true);

    expect($cards->collect(fn (string $permission) => $permission === 'newsletter.manage'))
        ->toBe(['newsletter' => ['subscribed' => 3]]);
});

test('a card key that the core already uses in the overview is rejected', function () {
    $cards = new DashboardCards;

    $cards->register('sites', 'rogue', 'sites.manage', fn () => []);

    expect(fn () => $cards->collect(fn () => true, ['sites' => []]))
        ->toThrow(LogicException::class, 'clashes with a core overview key');
});

test('a key that is not lower snake case is refused', function () {
    $cards = new DashboardCards;

    expect(fn () => $cards->register('Newsletter', 'newsletter', 'newsletter.manage', fn () => []))
        ->toThrow(InvalidArgumentException::class);
});

test('a card needs an owner and a permission', function () {
    $cards = new DashboardCards;

    expect(fn () => $cards->register('newsletter', ' ', 'newsletter.manage', fn () => []))
        ->toThrow(InvalidArgumentException::class, 'must name the module');

    expect(fn () => $cards->register('newsletter', 'newsletter', '', fn () => []))
        ->toThrow(InvalidArgumentException::class, 'needs a permission');
});
