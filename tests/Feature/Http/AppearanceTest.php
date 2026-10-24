<?php

declare(strict_types=1);

use App\Http\Middleware\HandleAppearance;
use Illuminate\Http\Request;

/**
 * The server decides the first paint of the light/dark switch, and the client
 * seeds its store from the same values. If these two ever disagree the
 * components hydrate over markup they did not render, which is exactly the
 * mismatch this suite guards against.
 */
function appearanceRequest(array $cookies = []): Request
{
    $request = Request::create('/', 'GET');

    foreach ($cookies as $name => $value) {
        $request->cookies->set($name, $value);
    }

    return $request;
}

it('defaults to system on a first visit and paints light', function () {
    expect(HandleAppearance::read(appearanceRequest()))
        ->toBe(['appearance' => 'system', 'resolved' => 'light']);
});

it('honours an explicit preference', function (string $preference) {
    expect(HandleAppearance::read(appearanceRequest(['appearance' => $preference])))
        ->toBe(['appearance' => $preference, 'resolved' => $preference]);
})->with(['light', 'dark']);

it('ignores a tampered cookie value', function () {
    expect(HandleAppearance::read(appearanceRequest(['appearance' => 'neon'])))
        ->toBe(['appearance' => 'system', 'resolved' => 'light']);
});

it('remembers what the browser reported for system', function (string $resolved) {
    expect(HandleAppearance::read(appearanceRequest([
        'appearance' => 'system',
        'appearance_resolved' => $resolved,
    ])))->toBe(['appearance' => 'system', 'resolved' => $resolved]);
})->with(['light', 'dark']);

it('writes the appearance onto the html element and into the shared props', function () {
    $response = $this->withUnencryptedCookie('appearance', 'dark')
        ->withUnencryptedCookie('appearance_resolved', 'dark')
        ->get('/');

    $response->assertOk()
        ->assertInertia(fn ($inertia) => $inertia
            ->where('appearance.appearance', 'dark')
            ->where('appearance.resolved', 'dark'));

    expect($response->getContent())
        ->toContain('data-appearance="dark"')
        ->toContain('data-appearance-resolved="dark"');
});
