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
