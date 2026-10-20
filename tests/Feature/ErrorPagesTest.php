<?php

use App\Models\User;

// Outside local and testing, errors render the app's own pages. Testing uses Laravel's default pages,
// so these tests switch the environment to production for the request.

test('a missing page renders the 404 page outside local and testing', function () {
    app()->detectEnvironment(fn () => 'production');

    $this->get('/this-page-does-not-exist')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page->component('errors/not-found-error'));
});

test('a forbidden request renders the 403 page outside local and testing', function () {
    app()->detectEnvironment(fn () => 'production');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.roles.index'))
        ->assertForbidden()
        ->assertInertia(fn ($page) => $page->component('errors/forbidden'));
});

test('json requests keep Laravel\'s JSON error response', function () {
    app()->detectEnvironment(fn () => 'production');

    $this->getJson('/this-page-does-not-exist')
        ->assertNotFound()
        ->assertJsonStructure(['message']);
});
