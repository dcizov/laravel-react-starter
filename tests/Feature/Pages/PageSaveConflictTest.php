<?php

declare(strict_types=1);

use App\Cms\Pages\PageRepository;
use App\Models\Page;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');

    $this->page = Page::factory()->create(['version' => 3]);
});

it('rejects a save that started before someone else saved', function () {
    // Someone else saves first: the version moves on.
    app(PageRepository::class)->update($this->page, ['title' => 'Theirs'], $this->editor);

    $this->actingAs($this->editor)
        ->patch("/admin/pages/{$this->page->id}/autosave", [
            'title' => 'Mine',
            'base_version' => 3,
        ])
        ->assertSessionHasErrors('page');

    expect($this->page->fresh()->title)->toBe('Theirs');
});

it('accepts a save that carries the current version and returns the new one', function () {
    $version = $this->page->fresh()->version;

    $response = $this->actingAs($this->editor)
        ->patch("/admin/pages/{$this->page->id}/autosave", [
            'title' => 'Mine',
            'base_version' => $version,
        ])
        ->assertOk();

    expect($response->json('version'))->toBe($version + 1)
        ->and($this->page->fresh()->title)->toBe('Mine');
});

it('still accepts saves that carry no version at all', function () {
    // Mobile clients and the plain form post do not send one; a missing
    // precondition must not turn into a hard failure.
    $this->actingAs($this->editor)
        ->patch("/admin/pages/{$this->page->id}/autosave", ['title' => 'No precondition'])
        ->assertOk();

    expect($this->page->fresh()->title)->toBe('No precondition');
});
