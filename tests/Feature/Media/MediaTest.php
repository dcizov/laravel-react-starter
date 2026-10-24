<?php

declare(strict_types=1);

use App\Cms\Media\MediaLibrary;
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

    $this->library = app(MediaLibrary::class);

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');
});

function uploadImage(MediaLibrary $library, ?User $user = null, string $name = 'hero.jpg'): Media
{
    return $library->store(
        UploadedFile::fake()->image($name, 1600, 1067),
        null,
        $user,
    );
}

it('stores an upload with its dimensions, a uuid and one thumbnail', function () {
    $media = uploadImage($this->library, $this->editor);

    expect($media->uuid)->not->toBeEmpty()
        ->and($media->type)->toBe('image')
        ->and($media->mime)->toBe('image/jpeg')
        ->and($media->width)->toBe(1600)
        ->and($media->height)->toBe(1067)
        ->and($media->humanSize())->not->toBeEmpty()
        ->and($media->uploaded_by)->toBe($this->editor->id)
        ->and($media->url())->toBe('/storage/'.$media->path);

    Storage::disk('public')->assertExists($media->path);
    Storage::disk('public')->assertExists($media->thumbnailPath());
    expect($media->thumbnailUrl())->toBe('/storage/'.$media->thumbnailPath());
});

it('keeps two uploads of the same file name apart', function () {
    $first = uploadImage($this->library, $this->editor, 'hero.jpg');
    $second = uploadImage($this->library, $this->editor, 'hero.jpg');

    expect($first->path)->not->toBe($second->path)
        ->and($first->original_name)->toBe('hero.jpg')
        ->and($second->original_name)->toBe('hero.jpg')
        ->and(Media::count())->toBe(2);
});

it('does not thumbnail a document', function () {
    $media = $this->library->store(
        UploadedFile::fake()->create('brief.pdf', 120, 'application/pdf'),
        null,
        $this->editor,
    );

    expect($media->type)->toBe('document')
        ->and($media->isImage())->toBeFalse()
        ->and($media->thumbnailUrl())->toBeNull()
        ->and($media->width)->toBeNull();

    Storage::disk('public')->assertMissing($media->thumbnailPath());
});

it('edits alt text and caption without touching the file', function () {
    $media = uploadImage($this->library, $this->editor);
    $path = $media->path;

    $this->library->update($media, [
        'alt' => 'Two designers reviewing a print proof',
        'caption' => 'Studio, spring 2026',
    ]);

    expect($media->refresh()->alt)->toBe('Two designers reviewing a print proof')
        ->and($media->caption)->toBe('Studio, spring 2026')
        ->and($media->path)->toBe($path);

    Storage::disk('public')->assertExists($path);
});

it('soft deletes, restores and purges', function () {
    $media = uploadImage($this->library, $this->editor);

    $this->library->delete($media);
    expect(Media::count())->toBe(0)
        ->and(Media::withTrashed()->count())->toBe(1)
        ->and($media->trashed())->toBeTrue();
    Storage::disk('public')->assertExists($media->path);

    $this->library->restore($media);
    expect($media->refresh()->trashed())->toBeFalse();

    $this->library->purge($media);
    expect(Media::withTrashed()->count())->toBe(0);
    Storage::disk('public')->assertMissing($media->path);
    Storage::disk('public')->assertMissing($media->thumbnailPath());
});

it('records where a page uses a media item', function () {
    $media = uploadImage($this->library, $this->editor);
    $other = uploadImage($this->library, $this->editor, 'secondary.jpg');

    $page = Page::factory()->create([
        'content' => [
            ['id' => 'a', 'section' => 'hero', 'enabled' => true, 'content' => ['heading' => 'Hi', 'image' => $media->url()]],
            ['id' => 'b', 'section' => 'cta', 'enabled' => true, 'content' => ['heading' => 'Go']],
        ],
        'featured_media_id' => $other->id,
    ]);

    expect($this->library->usageCount($media))->toBe(1)
        ->and($this->library->usageCount($other))->toBe(1);

    $usages = $this->library->usageList($media);

    expect($usages)->toHaveCount(1)
        ->and($usages[0]['title'])->toBe($page->title)
        ->and($usages[0]['field'])->toBe('content.0.content.image')
        ->and($usages[0]['url'])->toBe(route('admin.pages.edit', $page));
});

it('rewrites usages when a page stops using an image', function () {
    $media = uploadImage($this->library, $this->editor);

    $page = Page::factory()->create([
        'content' => [
            ['id' => 'a', 'section' => 'hero', 'enabled' => true, 'content' => ['heading' => 'Hi', 'image' => $media->url()]],
        ],
    ]);

    expect($this->library->usageCount($media))->toBe(1);

    $page->update([
        'content' => [
            ['id' => 'a', 'section' => 'hero', 'enabled' => true, 'content' => ['heading' => 'Hi', 'image' => null]],
        ],
    ]);

    expect($this->library->usageCount($media))->toBe(0);
});

it('forgets usages when a page is deleted', function () {
    $media = uploadImage($this->library, $this->editor);

    $page = Page::factory()->create([
        'content' => [
            ['id' => 'a', 'section' => 'hero', 'enabled' => true, 'content' => ['heading' => 'Hi', 'image' => $media->url()]],
        ],
    ]);

    $page->delete();

    expect($this->library->usageCount($media))->toBe(0);
});

it('builds a folder tree with unique sibling slugs', function () {
    $studio = $this->library->createFolder('Studio');
    $team = $this->library->createFolder('Team', $studio->id);
    $duplicate = $this->library->createFolder('Studio');

    expect($studio->slug)->toBe('studio')
        ->and($team->trail())->toBe(['Studio', 'Team'])
        ->and($team->depth())->toBe(1)
        ->and($duplicate->slug)->toBe('studio-2');

    $tree = $this->library->folderTree();

    expect($tree)->toHaveCount(3)
        ->and($tree[0]['depth'])->toBe(0);
});

it('refuses to delete a folder that still has contents', function () {
    $folder = $this->library->createFolder('Brand');
    $this->library->store(UploadedFile::fake()->image('logo.png', 400, 400), $folder->id, $this->editor);

    expect(fn () => $this->library->deleteFolder($folder))
        ->toThrow(RuntimeException::class, 'Move the folder contents before deleting it.');

    Media::query()->first()->update(['folder_id' => null]);
    $this->library->deleteFolder($folder);

    expect(MediaFolder::count())->toBe(0);
});

it('authorizes media by role', function () {
    $media = uploadImage($this->library, $this->editor);

    expect($this->author->can('viewAny', Media::class))->toBeTrue()
        ->and($this->author->can('create', Media::class))->toBeTrue()
        ->and($this->author->can('update', $media))->toBeFalse()
        ->and($this->author->can('delete', $media))->toBeFalse()
        ->and($this->editor->can('update', $media))->toBeTrue()
        ->and($this->editor->can('delete', $media))->toBeTrue();
});
