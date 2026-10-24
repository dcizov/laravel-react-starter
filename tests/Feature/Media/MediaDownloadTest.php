<?php

declare(strict_types=1);

use App\Cms\Media\MediaLibrary;
use App\Models\Media;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->seed(RolePermissionSeeder::class);

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');
});

function uploadDocument(MediaLibrary $library, User $user): Media
{
    return $library->store(
        UploadedFile::fake()->create('brief.pdf', 120, 'application/pdf'),
        null,
        $user,
    );
}

it('serves an uploaded document as an attachment with nosniff', function () {
    $media = uploadDocument(app(MediaLibrary::class), $this->editor);

    $response = $this->get(route('media.download', $media));

    $response->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Content-Type', 'application/pdf');

    expect($response->headers->get('Content-Disposition'))
        ->toStartWith('attachment')
        ->toContain('brief.pdf');
});

it('refuses to stream images through the document route', function () {
    $media = app(MediaLibrary::class)->store(
        UploadedFile::fake()->image('hero.jpg', 1600, 1067),
        null,
        $this->editor,
    );

    $this->get(route('media.download', $media))->assertNotFound();
});

it('401s a missing file instead of leaking the disk path', function () {
    $media = uploadDocument(app(MediaLibrary::class), $this->editor);

    Storage::disk('public')->delete($media->path);

    $this->get(route('media.download', $media))->assertNotFound();
});

it('points a document at the download route, not at /storage', function () {
    $media = uploadDocument(app(MediaLibrary::class), $this->editor);

    expect($media->url())->toBe(route('media.download', $media));
});
