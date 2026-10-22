<?php

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentEntryRevision;
use App\Models\User;
use App\Support\Rbac;

// Changing the publication of an entry that is already published, or publishing one, needs content.publish. This
// covers the status (live or not) and the date (when it goes live). Authors with only content.edit-own can still
// edit their own live entries, but they cannot change when or whether those entries are visible. Revision restores
// follow the same rule.

beforeEach(function () {
    Rbac::sync();

    // The edit form is a page. These tests check the server, not the bundle.
    $this->withoutVite();
});

/** A signed-in user holding exactly these permissions. */
function publicationUserWith(array $permissions): User
{
    $user = User::factory()->create();
    $user->givePermissionTo($permissions);

    return $user;
}

/** An author who can edit their own entries but cannot publish. */
function publicationAuthor(): User
{
    return publicationUserWith([Rbac::PERMISSION_CONTENT_VIEW, Rbac::PERMISSION_CONTENT_EDIT_OWN]);
}

/** An author who may also publish. */
function publicationPublishingAuthor(): User
{
    return publicationUserWith([
        Rbac::PERMISSION_CONTENT_VIEW,
        Rbac::PERMISSION_CONTENT_EDIT_OWN,
        Rbac::PERMISSION_CONTENT_PUBLISH,
    ]);
}

/** An editor who can change any entry and publish. */
function publicationEditor(): User
{
    return publicationUserWith([
        Rbac::PERMISSION_CONTENT_VIEW,
        Rbac::PERMISSION_CONTENT_EDIT_ANY,
        Rbac::PERMISSION_CONTENT_PUBLISH,
    ]);
}

/** A page live since three days ago, written by the given user. The date is minute-aligned so comparisons are exact. */
function publicationLivePage(?User $author = null, array $attributes = []): ContentEntry
{
    return ContentEntry::factory()->page()->create(array_merge([
        'author_id' => $author?->id,
        'title' => 'Original',
        'status' => ContentEntry::STATUS_PUBLISHED,
        'published_at' => now()->subDays(3)->startOfMinute(),
    ], $attributes));
}

/** Re-read an entry including trashed rows, so the tests see the stored state. */
function publicationFresh(ContentEntry $entry): ContentEntry
{
    return ContentEntry::withTrashed()->findOrFail($entry->id);
}

/** The fields the edit form posts, with the entry's current values unless overridden. */
function publicationPayload(ContentEntry $entry, array $overrides = []): array
{
    return array_merge([
        'title' => 'Changed by the test',
        'slug' => $entry->slug,
        'status' => $entry->status,
        'published_at' => $entry->published_at?->toDateTimeString(),
        'term_ids' => [],
        'body' => [],
    ], $overrides);
}

/** A stored revision of the entry with the given values changed from its current state. */
function publicationRevisionOf(ContentEntry $entry, array $overrides = []): ContentEntryRevision
{
    return ContentEntryRevision::store($entry, array_merge(ContentEntryRevision::snapshot($entry), $overrides), null);
}

function publicationUpdateUrl(ContentEntry $entry): string
{
    return route('admin.content.update', ['type' => 'page', 'entry' => $entry]);
}

function publicationRestoreUrl(ContentEntry $entry, ContentEntryRevision $revision): string
{
    return route('admin.content.revisions.restore', ['type' => 'page', 'entry' => $entry, 'revision' => $revision]);
}

/* Saving the edit form */

test('an author can edit their own live entry without changing its status or date', function () {
    $author = publicationAuthor();
    $entry = publicationLivePage($author);
    $publishedAt = $entry->published_at;

    $this->actingAs($author)
        ->put(publicationUpdateUrl($entry), publicationPayload($entry))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(publicationFresh($entry))
        ->title->toBe('Changed by the test')
        ->status->toBe(ContentEntry::STATUS_PUBLISHED)
        ->published_at->format('Y-m-d H:i')->toBe($publishedAt->format('Y-m-d H:i'));
});

test('an author without publish permission cannot move the date of their own live entry', function () {
    $author = publicationAuthor();
    $entry = publicationLivePage($author);
    $publishedAt = $entry->published_at;

    $this->actingAs($author)
        ->put(
            publicationUpdateUrl($entry),
            publicationPayload($entry, ['published_at' => now()->addDays(10)->startOfMinute()->toDateTimeString()]),
        )
        ->assertSessionHasErrors('published_at');

    expect(publicationFresh($entry))
        ->status->toBe(ContentEntry::STATUS_PUBLISHED)
        ->published_at->format('Y-m-d H:i')->toBe($publishedAt->format('Y-m-d H:i'));
});

test('an author without publish permission cannot unpublish their own live entry', function () {
    $author = publicationAuthor();
    $entry = publicationLivePage($author);

    $this->actingAs($author)
        ->put(publicationUpdateUrl($entry), publicationPayload($entry, ['status' => ContentEntry::STATUS_DRAFT]))
        ->assertSessionHasErrors('status');

    expect(publicationFresh($entry)->status)->toBe(ContentEntry::STATUS_PUBLISHED);
});

test('an author without publish permission cannot move the date of their own scheduled entry', function () {
    $author = publicationAuthor();
    $entry = ContentEntry::factory()->page()->scheduled()->create(['author_id' => $author->id]);
    $publishedAt = $entry->published_at;

    $this->actingAs($author)
        ->put(
            publicationUpdateUrl($entry),
            publicationPayload($entry, ['published_at' => now()->addDays(30)->startOfMinute()->toDateTimeString()]),
        )
        ->assertSessionHasErrors('published_at');

    expect(publicationFresh($entry)->published_at->format('Y-m-d H:i'))->toBe($publishedAt->format('Y-m-d H:i'));
});

test('an author without publish permission can change the date of their own draft', function () {
    $author = publicationAuthor();
    $entry = ContentEntry::factory()->page()->draft()->create(['author_id' => $author->id]);

    $this->actingAs($author)
        ->put(
            publicationUpdateUrl($entry),
            publicationPayload($entry, ['published_at' => now()->addDays(5)->startOfMinute()->toDateTimeString()]),
        )
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(publicationFresh($entry))
        ->status->toBe(ContentEntry::STATUS_DRAFT)
        ->published_at->not->toBeNull();
});

test('an author with publish permission can move the date of their own live entry', function () {
    $author = publicationPublishingAuthor();
    $entry = publicationLivePage($author);
    $newDate = now()->addDays(10)->startOfMinute();

    $this->actingAs($author)
        ->put(publicationUpdateUrl($entry), publicationPayload($entry, ['published_at' => $newDate->toDateTimeString()]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(publicationFresh($entry)->published_at->format('Y-m-d H:i'))->toBe($newDate->format('Y-m-d H:i'));
});

test('an editor with publish permission can move the date of any live entry', function () {
    $entry = publicationLivePage(User::factory()->create());
    $newDate = now()->addDays(10)->startOfMinute();

    $this->actingAs(publicationEditor())
        ->put(publicationUpdateUrl($entry), publicationPayload($entry, ['published_at' => $newDate->toDateTimeString()]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(publicationFresh($entry)->published_at->format('Y-m-d H:i'))->toBe($newDate->format('Y-m-d H:i'));
});

/* Restoring a revision */

test('restoring a revision that changes the date of a live entry is refused without publish permission', function () {
    $author = publicationAuthor();
    $entry = publicationLivePage($author);
    $revision = publicationRevisionOf($entry, [
        'title' => 'Old version',
        'published_at' => now()->addDays(10)->startOfMinute(),
    ]);
    $revisionCount = ContentEntryRevision::count();

    $this->actingAs($author)
        ->post(publicationRestoreUrl($entry, $revision))
        ->assertSessionHasErrors('published_at');

    expect(publicationFresh($entry))
        ->title->toBe('Original')
        ->status->toBe(ContentEntry::STATUS_PUBLISHED);
    expect(ContentEntryRevision::count())->toBe($revisionCount);
});

test('restoring a revision that changes whether an entry is live is refused without publish permission', function () {
    $author = publicationAuthor();
    $entry = publicationLivePage($author);
    $revision = publicationRevisionOf($entry, [
        'title' => 'Old version',
        'status' => ContentEntry::STATUS_DRAFT,
    ]);
    $revisionCount = ContentEntryRevision::count();

    $this->actingAs($author)
        ->post(publicationRestoreUrl($entry, $revision))
        ->assertSessionHasErrors('status');

    expect(publicationFresh($entry))
        ->title->toBe('Original')
        ->status->toBe(ContentEntry::STATUS_PUBLISHED);
    expect(ContentEntryRevision::count())->toBe($revisionCount);
});

test('a permitted revision restore still works', function () {
    $entry = publicationLivePage(User::factory()->create());
    $revision = publicationRevisionOf($entry, [
        'title' => 'Old version',
        'status' => ContentEntry::STATUS_DRAFT,
        'published_at' => null,
    ]);
    $revisionCount = ContentEntryRevision::count();

    $this->actingAs(publicationEditor())
        ->post(publicationRestoreUrl($entry, $revision))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(publicationFresh($entry))
        ->title->toBe('Old version')
        ->status->toBe(ContentEntry::STATUS_DRAFT)
        ->published_at->toBeNull();
    expect(ContentEntryRevision::count())->toBe($revisionCount + 1);
});

test('an author without publish permission can restore a revision that keeps the entry live and dated', function () {
    $author = publicationAuthor();
    $entry = publicationLivePage($author);
    $revision = publicationRevisionOf($entry, ['title' => 'Old version']);

    $this->actingAs($author)
        ->post(publicationRestoreUrl($entry, $revision))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(publicationFresh($entry))
        ->title->toBe('Old version')
        ->status->toBe(ContentEntry::STATUS_PUBLISHED);
});

/* Access to the update route */

test('guests cannot update an entry', function () {
    $entry = publicationLivePage(User::factory()->create());

    $this->put(publicationUpdateUrl($entry), publicationPayload($entry))->assertForbidden();

    expect(publicationFresh($entry)->title)->toBe('Original');
});

test('a user without content view permission cannot update an entry, even with an edit permission', function () {
    $authorWithoutView = publicationUserWith([Rbac::PERMISSION_CONTENT_EDIT_OWN]);
    $entry = publicationLivePage($authorWithoutView);
    $editorWithoutView = publicationUserWith([Rbac::PERMISSION_CONTENT_EDIT_ANY]);

    $this->actingAs($authorWithoutView)
        ->put(publicationUpdateUrl($entry), publicationPayload($entry))
        ->assertForbidden();

    $this->actingAs($editorWithoutView)
        ->put(publicationUpdateUrl($entry), publicationPayload($entry))
        ->assertForbidden();

    expect(publicationFresh($entry)->title)->toBe('Original');
});
