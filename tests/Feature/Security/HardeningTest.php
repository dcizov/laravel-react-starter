<?php

declare(strict_types=1);

use App\Cms\Pages\Slugger;
use App\Models\Page;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Request;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');
});

it('rejects a javascript: link in a section field', function () {
    $page = Page::factory()->create(['content' => [
        ['section' => 'cta', 'enabled' => true, 'content' => [
            'heading' => 'Talk to us',
            'body' => '',
            'button_label' => 'Click',
            'button_url' => 'javascript:alert(document.cookie)',
            'accent' => 'oklch(0.51 0.19 264)',
        ]],
    ]]);

    $this->actingAs($this->admin)
        ->patch("/admin/pages/{$page->id}", ['content' => $page->content])
        ->assertSessionHasErrors(['content.0.content.button_url']);

    expect($page->fresh()->content[0]['content']['button_url'])
        ->toBe('javascript:alert(document.cookie)');
});

it('accepts http, https and same-site links in a section field', function (string $url) {
    $page = Page::factory()->create(['content' => [
        ['section' => 'cta', 'enabled' => true, 'content' => [
            'heading' => 'Talk to us',
            'body' => '',
            'button_label' => 'Click',
            'button_url' => $url,
            'accent' => 'oklch(0.51 0.19 264)',
        ]],
    ]]);

    $this->actingAs($this->admin)
        ->patch("/admin/pages/{$page->id}", ['content' => $page->content])
        ->assertSessionHasNoErrors();

    expect($page->fresh()->content[0]['content']['button_url'])->toBe($url);
})->with([
    'https://example.com/contact',
    'http://example.com',
    '/contact',
    '#contact',
    '?page=2',
]);

it('rejects a reserved slug that the public route can never serve', function (string $slug) {
    $this->actingAs($this->admin)
        ->post('/admin/pages', ['title' => 'A page', 'slug' => $slug])
        ->assertSessionHasErrors('slug');
})->with(['login', 'admin', 'preview', 'settings']);

it('qualifies a reserved slug generated from the title', function () {
    $this->actingAs($this->admin)
        ->post('/admin/pages', ['title' => 'Login'])
        ->assertSessionHasNoErrors();

    expect(Page::query()->latest('id')->first()?->slug)->toBe('login-page');
    expect(app(Slugger::class)->unique('Register'))->toBe('register-page');
});

it('normalises an unexpected appearance cookie before rendering it', function () {
    $this->withUnencryptedCookie('appearance', "dark'; alert(1); //")
        ->get('/')
        ->assertOk()
        ->assertSee('const appearance = "system"', false);
});

it('applies a valid appearance cookie', function () {
    $this->withUnencryptedCookie('appearance', 'dark')
        ->get('/')
        ->assertOk()
        ->assertSee('const appearance = "dark"', false);
});

it('ignores a forwarded-for header when no proxy is trusted', function () {
    $request = Request::create('/', 'GET', [], [], [], [
        'REMOTE_ADDR' => '203.0.113.9',
        'HTTP_X_FORWARDED_FOR' => '10.9.9.9',
    ]);

    app(HttpKernel::class)->handle($request);

    expect($request->ip())->toBe('203.0.113.9');
});
