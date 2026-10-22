<?php

use App\Features\Landing\LandingBlocks;
use App\Features\Landing\LandingPresets;
use App\Models\User;
use App\Settings\AppSettings;
use App\Support\ErrorPages;
use App\Support\Rbac;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    Rbac::sync();
});

function landingAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

function block(string $id, string $type, array $data): array
{
    return ['id' => $id, 'type' => $type, 'data' => $data];
}

function landingTheme(array $overrides = []): array
{
    return array_merge([
        'primary' => '#0369a1',
        'background' => '#f8fbff',
        'foreground' => '#0f172a',
        'radius' => 0.75,
        'font' => 'sans',
        'text_size' => 'md',
    ], $overrides);
}

test('the home page shows the default landing page when it is switched on', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->where('preview', false)
            ->where('blocks.0.type', 'navbar')
            ->where('blocks.1.type', 'hero')
            ->where('theme.font', 'sans'));
});

test('with the landing page switched off, guests go to login and users go to the dashboard', function () {
    config(['features.enabled' => ['integrations']]);

    $this->get('/')->assertRedirect(route('login'));

    $this->actingAs(User::factory()->create())
        ->get('/')
        ->assertRedirect(route('dashboard'));
});

test('a user without landing.manage cannot open the editor or the preview', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin.landing.index'))->assertForbidden();
    $this->actingAs($user)->get(route('admin.landing.preview'))->assertForbidden();
});

test('a draft keeps only the fields each block type allows', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['theme' => landingTheme(), 'blocks' => [
            block('hero-1', 'hero', ['title' => 'Hi', 'text' => 'There', 'onclick' => 'alert(1)']),
        ]])
        ->assertRedirect();

    $draft = app(AppSettings::class)->landing_draft;

    expect($draft[0]['data'])->toHaveKeys(['title', 'text'])
        ->and($draft[0]['data'])->not->toHaveKey('onclick');
});

test('links that are not http, https, or a site path are rejected', function (string $url) {
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['theme' => landingTheme(), 'blocks' => [
            block('button-1', 'button', ['label' => 'Click', 'url' => $url]),
        ]])
        ->assertSessionHasErrors('blocks.0.data.url');
})->with([
    'javascript' => ['javascript:alert(1)'],
    'data' => ['data:text/html;base64,PHNjcmlwdD4='],
    'protocol relative' => ['//evil.example.com'],
]);

test('an unknown block type is rejected', function () {
    $this->actingAs(landingAdmin())
        ->put(route('admin.landing.draft.update'), ['theme' => landingTheme(), 'blocks' => [
            block('x-1', 'script', ['body' => 'x']),
        ]])
        ->assertSessionHasErrors('blocks.0.type');
});

test('publishing copies the draft to the public page, and discarding resets the draft', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['theme' => landingTheme(), 'blocks' => [
            block('text-1', 'text', ['heading' => 'New', 'body' => 'Published text']),
        ]]);

    $this->actingAs($admin)->post(route('admin.landing.publish'))->assertRedirect();

    $this->get('/')->assertInertia(fn ($page) => $page->where('blocks.0.data.body', 'Published text'));

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['theme' => landingTheme(), 'blocks' => []]);

    $this->actingAs($admin)->post(route('admin.landing.discard'))->assertRedirect();

    expect(app(AppSettings::class)->landing_draft)->toEqual(app(AppSettings::class)->landing_published);
});

test('an empty draft is kept as empty instead of falling back to the published page', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)->put(route('admin.landing.draft.update'), ['theme' => landingTheme(), 'blocks' => []]);

    expect(app(AppSettings::class)->landing_draft)->toBe([]);
});

test('the preview shows the draft and is marked as a preview', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['theme' => landingTheme(), 'blocks' => [
            block('text-2', 'text', ['body' => 'Draft only']),
        ]]);

    $this->actingAs($admin)
        ->get(route('admin.landing.preview'))
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->where('preview', true)
            ->where('blocks.0.data.body', 'Draft only'));
});

test('images must be png, jpeg, or webp, and SVG is refused', function () {
    Storage::fake('public');
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->postJson(route('admin.landing.images.store'), [
            'image' => UploadedFile::fake()->create('logo.svg', 10, 'image/svg+xml'),
        ])
        ->assertUnprocessable();

    $this->actingAs($admin)
        ->postJson(route('admin.landing.images.store'), [
            'image' => UploadedFile::fake()->image('hero.png'),
        ])
        ->assertOk()
        ->assertJsonPath('url', fn ($url) => str_starts_with($url, '/storage/landing/'));
});

test('the admin settings save the error-page and landing switches', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->patch(route('admin-settings.update'), [
            'app_name' => 'Test',
            'default_role' => Rbac::DEFAULT_ROLE,
            'custom_error_pages' => false,
        ])
        ->assertRedirect();

    $settings = app(AppSettings::class);

    expect($settings->custom_error_pages)->toBeFalse()
        ->and(ErrorPages::enabled())->toBeFalse();
});

test('the built-in default blocks pass the same validation as admin blocks', function () {
    expect(LandingBlocks::validate(LandingBlocks::defaults()))->toEqual(LandingBlocks::defaults());
});

test('the new section types accept their fields and drop anything else', function () {
    $draft = LandingBlocks::validate([
        block('logos-1', 'logos', ['title' => 'Trusted by', 'items' => [['name' => 'Acme', 'x' => 'drop']]]),
        block('stats-1', 'stats', ['items' => [['value' => '10k+', 'label' => 'Users']]]),
        block('faq-1', 'faq', ['items' => [['question' => 'Why?', 'answer' => 'Because.', 'html' => '<b>x</b>']]]),
        block('cta-1', 'cta', ['title' => 'Start', 'button_label' => 'Go', 'button_url' => '/register']),
    ]);

    expect($draft[0]['data']['items'][0])->toEqual(['name' => 'Acme'])
        ->and($draft[2]['data']['items'][0])->not->toHaveKey('html')
        ->and($draft[3]['data'])->toHaveKeys(['title', 'button_url']);
});

test('the new section types reject unsafe links and too many items', function () {
    expect(fn () => LandingBlocks::validate([
        block('pricing-1', 'pricing', ['items' => [[
            'name' => 'Pro',
            'price' => '€9',
            'button_label' => 'Buy',
            'button_url' => 'javascript:alert(1)',
        ]]]),
    ]))->toThrow(ValidationException::class);

    expect(fn () => LandingBlocks::validate([
        block('stats-1', 'stats', ['items' => array_fill(0, 7, ['value' => '1', 'label' => 'x'])]),
    ]))->toThrow(ValidationException::class);
});

test('the default page uses the section types, with a navigation bar and then a hero', function () {
    $types = array_column(LandingBlocks::defaults(), 'type');

    expect($types)->toContain('logos', 'features', 'stats', 'faq', 'cta')
        ->and($types[0])->toBe('navbar')
        ->and($types[1])->toBe('hero');
});

test('the enabled features and active addons are shared with every page', function () {
    $user = User::factory()->create();
    $user->assignRole(Rbac::DEFAULT_ROLE);

    config(['features.enabled' => ['integrations']]);
    activateNewsletterAddon();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('features', ['integrations'])->where('addons', ['newsletter']));

    config(['features.enabled' => ['landing']]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('features', ['landing']));
});

test('feature icons must be one of the allowed keys, and pricing keeps its badge', function () {
    expect(fn () => LandingBlocks::validate([
        block('features-1', 'features', ['items' => [['title' => 'Fast', 'icon' => 'skull']]]),
    ]))->toThrow(ValidationException::class);

    $draft = LandingBlocks::validate([
        block('features-2', 'features', ['items' => [['title' => 'Fast', 'icon' => 'zap']]]),
        block('pricing-2', 'pricing', ['items' => [['name' => 'Pro', 'price' => '€9', 'badge' => 'Most popular']]]),
    ]);

    expect($draft[0]['data']['items'][0]['icon'])->toBe('zap')
        ->and($draft[1]['data']['items'][0]['badge'])->toBe('Most popular');
});

test('a block keeps its design settings and drops anything else', function () {
    $draft = LandingBlocks::validate([
        [
            'id' => 'hero-style',
            'type' => 'hero',
            'data' => ['title' => 'Hi'],
            'style' => [
                'variant' => 1,
                'bg_color' => '#112233',
                'bg_image' => '/storage/landing/a.png',
                'bg_overlay' => 30,
                'text_color' => '',
                'padding' => 'lg',
                'width' => 'wide',
                'align' => 'left',
                'heading_size' => 'xl',
                'font' => 'serif',
                'animation' => 'zoom-in',
                'css' => 'position:fixed',
            ],
        ],
    ]);

    expect($draft[0]['style'])->toHaveKeys(['variant', 'bg_color', 'bg_image', 'bg_overlay', 'padding', 'width', 'align', 'heading_size', 'font', 'animation'])
        ->and($draft[0]['style'])->not->toHaveKey('css');
});

test('a block without a style is saved without one, so the defaults apply', function () {
    $draft = LandingBlocks::validate([block('text-9', 'text', ['body' => 'x'])]);

    expect($draft[0])->not->toHaveKey('style');
});

test('a layout must exist for its block type', function (string $type, array $data, int $variant, bool $valid) {
    $check = fn () => LandingBlocks::validate([
        ['id' => 'x-1', 'type' => $type, 'data' => $data, 'style' => ['variant' => $variant]],
    ]);

    if ($valid) {
        expect($check)->not->toThrow(ValidationException::class);
    } else {
        expect($check)->toThrow(ValidationException::class);
    }
})->with([
    'text has five layouts' => ['text', ['body' => 'x'], 4, true],
    'image has four layouts' => ['image', ['src' => 'https://example.com/a.png'], 3, true],
    'image has no fifth layout' => ['image', ['src' => 'https://example.com/a.png'], 4, false],
    'button has no fifth layout' => ['button', ['label' => 'Go', 'url' => '/register'], 4, false],
]);

test('style values must be from the allowed choices', function (string $field, mixed $value) {
    expect(fn () => LandingBlocks::validate([
        ['id' => 'x-1', 'type' => 'text', 'data' => ['body' => 'x'], 'style' => [$field => $value]],
    ]))->toThrow(ValidationException::class);
})->with([
    'variant out of range' => ['variant', 5],
    'colour is not hex' => ['bg_color', 'red'],
    'text colour injected' => ['text_color', '#fff;background:url(x)'],
    'unknown padding' => ['padding', 'huge'],
    'overlay too dark' => ['bg_overlay', 95],
    'background image is javascript' => ['bg_image', 'javascript:alert(1)'],
    'unknown animation' => ['animation', 'spin'],
    'unknown text effect' => ['text_effect', 'spin'],
]);

test('the page theme keeps its fields and rejects bad values', function () {
    expect(LandingBlocks::validateTheme(landingTheme()))->toEqual(landingTheme());

    expect(fn () => LandingBlocks::validateTheme(landingTheme(['primary' => 'blue'])))->toThrow(ValidationException::class);
    expect(fn () => LandingBlocks::validateTheme(landingTheme(['radius' => 4])))->toThrow(ValidationException::class);
    expect(fn () => LandingBlocks::validateTheme(landingTheme(['font' => 'Comic Sans'])))->toThrow(ValidationException::class);
});

test('a draft with an invalid theme is refused', function () {
    $this->actingAs(landingAdmin())
        ->put(route('admin.landing.draft.update'), [
            'theme' => landingTheme(['primary' => 'nope']),
            'blocks' => [block('text-4', 'text', ['body' => 'x'])],
        ])
        ->assertSessionHasErrors('theme.primary');
});

test('the theme is drafted, published with the blocks, and replaced with them on discard', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)->put(route('admin.landing.draft.update'), [
        'theme' => landingTheme(['primary' => '#ea580c', 'font' => 'serif']),
        'blocks' => [block('text-3', 'text', ['body' => 'Themed'])],
    ])->assertRedirect();

    $this->actingAs($admin)->post(route('admin.landing.publish'))->assertRedirect();

    $this->get('/')->assertInertia(fn ($page) => $page
        ->where('theme.primary', '#ea580c')
        ->where('theme.font', 'serif'));

    $this->actingAs($admin)->put(route('admin.landing.draft.update'), [
        'theme' => landingTheme(['primary' => '#000000']),
        'blocks' => [],
    ]);

    $this->actingAs($admin)->post(route('admin.landing.discard'))->assertRedirect();

    expect(app(AppSettings::class)->landing_theme_draft)->toEqual(app(AppSettings::class)->landing_theme);
});

test('every starting page passes the same validation as admin blocks, with unique ids', function () {
    foreach (LandingPresets::all() as $preset) {
        $blocks = LandingBlocks::validate($preset['blocks']);

        expect($blocks)->toEqual($preset['blocks'])
            ->and(array_column($blocks, 'id'))->toEqual(array_unique(array_column($blocks, 'id')));

        if (isset($preset['theme'])) {
            expect(LandingBlocks::validateTheme($preset['theme']))->toEqual($preset['theme']);
        }
    }
});

test('the visual editor is given the starting pages and their themes', function () {
    $this->actingAs(landingAdmin())
        ->get(route('admin.landing.index'))
        ->assertInertia(fn ($page) => $page
            ->component('admin/landing')
            ->has('presets', 3)
            ->where('presets.0.key', 'starter')
            ->where('presets.1.theme.primary', '#0369a1')
            ->has('theme'));
});

test('a navigation bar keeps its links and button, and drops anything else', function () {
    $draft = LandingBlocks::validate([
        block('nav-1', 'navbar', [
            'items' => [
                ['label' => 'Features', 'url' => '#features', 'x' => 'drop'],
                ['label' => 'Log in', 'url' => '/login'],
                ['label' => 'Docs', 'url' => 'https://example.com/docs'],
            ],
            'button_label' => 'Start',
            'button_url' => '/register',
            'html' => '<b>x</b>',
        ]),
    ]);

    expect($draft[0]['data'])->toHaveKeys(['items', 'button_label', 'button_url'])
        ->and($draft[0]['data'])->not->toHaveKey('html')
        ->and($draft[0]['data']['items'][0])->toEqual(['label' => 'Features', 'url' => '#features'])
        ->and($draft[0]['data']['items'][2]['url'])->toBe('https://example.com/docs');
});

test('a navigation bar rejects unsafe links and too many links', function () {
    expect(fn () => LandingBlocks::validate([
        block('nav-2', 'navbar', ['items' => [['label' => 'Bad', 'url' => 'javascript:alert(1)']]]),
    ]))->toThrow(ValidationException::class);

    expect(fn () => LandingBlocks::validate([
        block('nav-4', 'navbar', ['items' => array_fill(0, 7, ['label' => 'x', 'url' => '/'])]),
    ]))->toThrow(ValidationException::class);
});

test('the guest language switch stores the chosen locale in the session', function () {
    $this->post(route('language.guest'), ['locale' => 'de'])
        ->assertRedirect()
        ->assertSessionHas('locale', 'de');

    $this->post(route('language.guest'), ['locale' => 'xx'])
        ->assertSessionHasErrors('locale');
});

test('a footer keeps its columns and links, and rejects unsafe links and too many columns', function () {
    $draft = LandingBlocks::validate([
        block('footer-1', 'footer', [
            'text' => 'Short line.',
            'columns' => [
                ['title' => 'Product', 'links' => [['label' => 'Pricing', 'url' => '#pricing']]],
                ['title' => 'Legal', 'links' => [], 'x' => 'drop'],
            ],
            'copyright' => '© 2026 Acme',
        ]),
    ]);

    expect($draft[0]['data']['columns'])->toHaveCount(2)
        ->and($draft[0]['data']['columns'][0]['links'][0])->toEqual(['label' => 'Pricing', 'url' => '#pricing'])
        ->and($draft[0]['data']['columns'][1])->not->toHaveKey('x');

    expect(fn () => LandingBlocks::validate([
        block('footer-2', 'footer', ['columns' => [['title' => 'A', 'links' => [['label' => 'x', 'url' => 'data:text/html,x']]]]]),
    ]))->toThrow(ValidationException::class);

    expect(fn () => LandingBlocks::validate([
        block('footer-3', 'footer', ['columns' => array_fill(0, 5, ['title' => 'A', 'links' => []])]),
    ]))->toThrow(ValidationException::class);
});

test('a draft with two blocks sharing an id is refused', function () {
    $this->actingAs(landingAdmin())
        ->put(route('admin.landing.draft.update'), ['theme' => landingTheme(), 'blocks' => [
            block('same-id', 'text', ['body' => 'One']),
            block('same-id', 'text', ['body' => 'Two']),
        ]])
        ->assertSessionHasErrors('blocks.1.id');
});

test('every starting page opens with a navigation bar and closes with a footer', function () {
    foreach (LandingPresets::all() as $preset) {
        $blocks = $preset['blocks'];

        expect($blocks[0]['type'])->toBe('navbar')
            ->and($blocks[array_key_last($blocks)]['type'])->toBe('footer');

        // Every link on the bar points at a section that is on the page.
        $types = array_column($blocks, 'type');

        foreach ($blocks[0]['data']['items'] as $link) {
            if (str_starts_with($link['url'], '#')) {
                expect($types)->toContain(substr($link['url'], 1));
            }
        }
    }
});

test('the public page passes the default theme when nothing is published', function () {
    $this->get('/')->assertInertia(fn ($page) => $page
        ->has('theme')
        ->where('theme.primary', LandingBlocks::defaultTheme()['primary']));
});
