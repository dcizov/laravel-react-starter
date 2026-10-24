<?php

declare(strict_types=1);

use App\Models\Page;
use App\Models\User;

it('sends hardening headers on a public page', function () {
    $page = Page::factory()->published()->create();

    $response = $this->get('/'.$page->slug);

    $response->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    $csp = $response->headers->get('Content-Security-Policy');

    expect($csp)->toBeString()
        ->and($csp)->toContain("default-src 'self'")
        ->and($csp)->toContain("object-src 'none'")
        ->and($csp)->toContain("base-uri 'self'")
        ->and($csp)->toContain("form-action 'self'")
        ->and($csp)->toContain('nonce-');
});

it('does not open the policy up outside local development', function () {
    $page = Page::factory()->published()->create();

    $csp = $this->get('/'.$page->slug)->headers->get('Content-Security-Policy');

    expect($csp)->not->toContain('unsafe-eval')
        ->and($csp)->not->toContain('unsafe-inline; script');
});

it('uses the same nonce in the policy and in the inline bootstrap script', function () {
    $page = Page::factory()->published()->create();

    $response = $this->get('/'.$page->slug);
    $csp = $response->headers->get('Content-Security-Policy');

    preg_match('/<script nonce="([^"]+)"/', $response->getContent(), $matches);

    expect($matches[1] ?? '')->not->toBeEmpty()
        ->and($csp)->toContain("'nonce-{$matches[1]}'");
});

it('sets the headers on admin responses too', function () {
    $user = User::factory()->create();
    $user->assignRole('Admin');

    $this->actingAs($user)
        ->get('/admin')
        ->assertHeader('X-Content-Type-Options', 'nosniff');
});

/**
 * In development `npm run dev` serves the stylesheet and the fonts from the
 * Vite dev server, which is a different origin from the app. `'self'` does not
 * cover it and a nonce cannot cover a `<link rel="stylesheet">`, so the policy
 * has to name the origin or the page renders without CSS while every script
 * still runs. The origin is read from Vite's hot file, so it is only ever
 * allowed while the dev server is actually up.
 */
it('allows the Vite dev server origin in local development', function () {
    $page = Page::factory()->published()->create();
    $hotFile = public_path('hot');

    file_put_contents($hotFile, 'http://localhost:5173');

    $this->app->detectEnvironment(fn (): string => 'local');

    try {
        $csp = (string) $this->get('/'.$page->slug)->headers->get('Content-Security-Policy');
    } finally {
        @unlink($hotFile);
        $this->app->detectEnvironment(fn (): string => 'testing');
    }

    expect($csp)->toContain('http://localhost:5173')
        ->and($csp)->toContain('unsafe-eval');
});

it('never names the dev server outside local development', function () {
    $page = Page::factory()->published()->create();
    $hotFile = public_path('hot');

    file_put_contents($hotFile, 'http://localhost:5173');

    try {
        $csp = (string) $this->get('/'.$page->slug)->headers->get('Content-Security-Policy');
    } finally {
        @unlink($hotFile);
    }

    expect($csp)->not->toContain('localhost:5173')
        ->and($csp)->not->toContain('unsafe-eval');
});

it('ignores a hot file that is not a plain http origin', function () {
    $page = Page::factory()->published()->create();
    $hotFile = public_path('hot');

    file_put_contents($hotFile, "javascript:alert(1); style-src *\n");

    $this->app->detectEnvironment(fn (): string => 'local');

    try {
        $csp = (string) $this->get('/'.$page->slug)->headers->get('Content-Security-Policy');
    } finally {
        @unlink($hotFile);
        $this->app->detectEnvironment(fn (): string => 'testing');
    }

    expect($csp)->not->toContain('javascript:')
        ->and($csp)->not->toContain('style-src *');
});
