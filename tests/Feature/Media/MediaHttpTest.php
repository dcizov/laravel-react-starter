<?php

use App\Models\Media;
use App\Models\MediaFolder;
use App\Models\Page;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->seed(RolePermissionSeeder::class);

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');
});

it('renders the library with counts, folders and permission flags', function () {
    MediaFolder::query()->create(['name' => 'Brand', 'slug' => 'brand']);

    $this->actingAs($this->editor)->post('/admin/media', [
        'files' => [UploadedFile::fake()->image('hero.jpg', 1600, 1067)],
    ])->assertRedirect();

    $this->actingAs($this->editor)
        ->get('/admin/media')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/media/index')
            ->has('media.data', 1)
            ->where('media.data.0.original_name', 'hero.jpg')
            ->where('media.data.0.width', 1600)
            ->where('media.data.0.usages', 0)
            ->has('folders', 1)
            ->where('counts.all', 1)
            ->where('can.upload', true)
            ->where('can.delete', true));

    $this->actingAs($this->author)
        ->get('/admin/media')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('can.upload', true)
            ->where('can.update', false)
            ->where('can.delete', false));
});

it('uploads several files at once into the selected folder', function () {
    $folder = MediaFolder::query()->create(['name' => 'Brand', 'slug' => 'brand']);

    $this->actingAs($this->editor)->post('/admin/media', [
        'folder_id' => $folder->id,
        'files' => [
            UploadedFile::fake()->image('one.jpg', 800, 600),
            UploadedFile::fake()->image('two.png', 640, 480),
            UploadedFile::fake()->create('brief.pdf', 100, 'application/pdf'),
        ],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Media::count())->toBe(3)
        ->and(Media::where('folder_id', $folder->id)->count())->toBe(3)
        ->and(Media::where('type', 'image')->count())->toBe(2)
        ->and(Media::where('type', 'document')->count())->toBe(1);

    foreach (Media::where('type', 'image')->get() as $media) {
        Storage::disk('public')->assertExists($media->thumbnailPath());
    }
});

it('rejects uploads that are too large or of the wrong type', function () {
    $this->actingAs($this->editor)->post('/admin/media', [
        'files' => [UploadedFile::fake()->create('payload.php', 4, 'application/x-php')],
    ])->assertSessionHasErrors('files.0');

    $this->actingAs($this->editor)->post('/admin/media', [
        'files' => [UploadedFile::fake()->create('huge.zip', 13 * 1024, 'application/zip')],
    ])->assertSessionHasErrors('files.0');

    $this->actingAs($this->editor)->post('/admin/media', [
        'files' => [UploadedFile::fake()->create('enormous.jpg', 13 * 1024, 'image/jpeg')],
    ])->assertSessionHasErrors('files.0');

    $this->actingAs($this->editor)->post('/admin/media', [])->assertSessionHasErrors('files');

    expect(Media::count())->toBe(0);
});

it('refuses uploads from guests and users without the upload permission', function () {
    $this->post('/admin/media', ['files' => [UploadedFile::fake()->image('x.jpg')]])
        ->assertRedirect('/login');

    $viewer = User::factory()->create();

    $this->actingAs($viewer)
        ->post('/admin/media', ['files' => [UploadedFile::fake()->image('x.jpg')]])
        ->assertForbidden();

    expect(Media::count())->toBe(0);
});

it('edits alt text and caption in place', function () {
    $this->actingAs($this->editor)->post('/admin/media', [
        'files' => [UploadedFile::fake()->image('hero.jpg')],
    ]);

    $media = Media::query()->firstOrFail();

    $this->actingAs($this->editor)
        ->patch("/admin/media/{$media->id}", ['alt' => 'A print proof on a studio table'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($media->refresh()->alt)->toBe('A print proof on a studio table');

    $this->actingAs($this->author)
        ->patch("/admin/media/{$media->id}", ['alt' => 'Author tries to edit'])
        ->assertForbidden();

    expect($media->refresh()->alt)->toBe('A print proof on a studio table');
});

it('warns about usages when deleting and can undo', function () {
    $this->actingAs($this->editor)->post('/admin/media', [
        'files' => [UploadedFile::fake()->image('hero.jpg')],
    ]);

    $media = Media::query()->firstOrFail();

    Page::factory()->create([
        'content' => [
            ['id' => 'a', 'section' => 'hero', 'enabled' => true, 'content' => ['heading' => 'Hi', 'image' => $media->url()]],
        ],
    ]);

    expect($media->usages()->count())->toBe(1);

    $this->actingAs($this->editor)
        ->delete("/admin/media/{$media->id}")
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'warning');

    expect(Media::count())->toBe(0)
        ->and(Media::withTrashed()->count())->toBe(1);

    $this->actingAs($this->editor)
        ->post("/admin/media/{$media->id}/restore")
        ->assertRedirect();

    expect(Media::count())->toBe(1)
        ->and($media->refresh()->trashed())->toBeFalse();
});

it('shows who uses a media item on the index', function () {
    $this->actingAs($this->editor)->post('/admin/media', [
        'files' => [UploadedFile::fake()->image('hero.jpg')],
    ]);

    $media = Media::query()->firstOrFail();
    $page = Page::factory()->create([
        'title' => 'Services',
        'content' => [
            ['id' => 'a', 'section' => 'hero', 'enabled' => true, 'content' => ['heading' => 'Hi', 'image' => $media->url()]],
        ],
    ]);

    $this->actingAs($this->editor)
        ->get('/admin/media')
        ->assertInertia(fn ($inertia) => $inertia
            ->where('media.data.0.usages', 1)
            ->where('media.data.0.usages_detail.0.title', 'Services')
            ->where('media.data.0.usages_detail.0.field', 'content.0.content.image')
            ->where('media.data.0.usages_detail.0.url', route('admin.pages.edit', $page)));
});

it('creates, renames and deletes folders, refusing a folder that is not empty', function () {
    $this->actingAs($this->editor)
        ->post('/admin/media/folders', ['name' => 'Brand assets'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $folder = MediaFolder::query()->firstOrFail();

    expect($folder->slug)->toBe('brand-assets');

    $this->actingAs($this->editor)
        ->post('/admin/media/folders', ['name' => 'Brand assets'])
        ->assertSessionHasErrors('name');

    $this->actingAs($this->editor)
        ->patch("/admin/media/folders/{$folder->id}", ['name' => 'Brand'])
        ->assertRedirect();

    expect($folder->refresh()->name)->toBe('Brand');

    $this->actingAs($this->editor)->post('/admin/media', [
        'folder_id' => $folder->id,
        'files' => [UploadedFile::fake()->image('logo.png', 300, 300)],
    ]);

    $this->actingAs($this->editor)
        ->delete("/admin/media/folders/{$folder->id}")
        ->assertSessionHasErrors('folder');

    Media::query()->firstOrFail()->update(['folder_id' => null]);

    $this->actingAs($this->editor)
        ->delete("/admin/media/folders/{$folder->id}")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(MediaFolder::count())->toBe(0);
});

it('filters the library by search term, type and trash', function () {
    $this->actingAs($this->editor)->post('/admin/media', [
        'files' => [
            UploadedFile::fake()->image('studio-shot.jpg'),
            UploadedFile::fake()->create('contract.pdf', 40, 'application/pdf'),
        ],
    ]);

    $this->actingAs($this->editor)
        ->get('/admin/media?q=studio')
        ->assertInertia(fn ($page) => $page->has('media.data', 1)->where('media.data.0.original_name', 'studio-shot.jpg'));

    $this->actingAs($this->editor)
        ->get('/admin/media?type=document')
        ->assertInertia(fn ($page) => $page->has('media.data', 1)->where('media.data.0.original_name', 'contract.pdf'));

    $media = Media::query()->where('type', 'document')->firstOrFail();
    $this->actingAs($this->editor)->delete("/admin/media/{$media->id}");

    $this->actingAs($this->editor)
        ->get('/admin/media?trashed=1')
        ->assertInertia(fn ($page) => $page->has('media.data', 1)->where('media.data.0.original_name', 'contract.pdf'));

    $this->actingAs($this->editor)
        ->get('/admin/media')
        ->assertInertia(fn ($page) => $page->has('media.data', 1)->where('counts.trashed', 1));
});

it('serves the picker browse endpoint with folders and upload capability', function () {
    $folder = MediaFolder::query()->create(['name' => 'Brand', 'slug' => 'brand']);

    $this->actingAs($this->editor)->post('/admin/media', [
        'folder_id' => $folder->id,
        'files' => [UploadedFile::fake()->image('studio-shot.jpg')],
    ]);

    $this->actingAs($this->editor)
        ->getJson('/admin/media/browse')
        ->assertOk()
        ->assertJsonPath('media.0.original_name', 'studio-shot.jpg')
        ->assertJsonPath('media.0.folder', 'Brand')
        ->assertJsonPath('folders.0.name', 'Brand')
        ->assertJsonPath('can.upload', true);

    $this->actingAs($this->editor)
        ->getJson("/admin/media/browse?folder={$folder->id}")
        ->assertOk()
        ->assertJsonCount(1, 'media');

    $this->actingAs($this->editor)
        ->getJson('/admin/media/browse?q=nothing-matches')
        ->assertOk()
        ->assertJsonCount(0, 'media');
});

it('protects the browse endpoint', function () {
    $this->getJson('/admin/media/browse')->assertUnauthorized();

    $viewer = User::factory()->create();

    $this->actingAs($viewer)->getJson('/admin/media/browse')->assertForbidden();
});
