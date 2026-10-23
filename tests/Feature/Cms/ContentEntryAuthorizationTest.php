<?php

use App\Features\Cms\Models\ContentEntry;
use App\Models\User;
use App\Support\Rbac;

// Authorization and lifecycle for the admin content entries. The rules come from ContentEntryPolicy, the
// route permission groups, and ContentEntryRequest. Editors hold content.edit-any; authors hold content.edit-own,
// which only covers entries they wrote. Publishing, trashing, and permanent deletion each have their own permission.

beforeEach(function () {
    Rbac::sync();

    // The edit form is a page. These tests check the server, not the bundle.
    $this->withoutVite();
});

/** A signed-in user holding exactly these permissions. */
function cmsUserWith(array $permissions): User
{
    $user = User::factory()->create();
    $user->givePermissionTo($permissions);

    return $user;
}

function cmsEditor(): User
{
    return cmsUserWith([
        Rbac::PERMISSION_CONTENT_VIEW,
        Rbac::PERMISSION_CONTENT_EDIT_ANY,
        Rbac::PERMISSION_CONTENT_PUBLISH,
        Rbac::PERMISSION_CONTENT_DELETE,
    ]);
}

function cmsAuthor(): User
{
    return cmsUserWith([Rbac::PERMISSION_CONTENT_VIEW, Rbac::PERMISSION_CONTENT_EDIT_OWN]);
}

/** An author who may also publish. Still cannot change entries they did not write. */
function cmsPublishingAuthor(): User
{
    return cmsUserWith([
        Rbac::PERMISSION_CONTENT_VIEW,
        Rbac::PERMISSION_CONTENT_EDIT_OWN,
        Rbac::PERMISSION_CONTENT_PUBLISH,
    ]);
}

/** A page written by the given user, or by nobody. Live by default, as the factory makes it. */
function cmsPage(?User $author = null, array $attributes = []): ContentEntry
{
    return ContentEntry::factory()->page()->create(array_merge([
        'author_id' => $author?->id,
    ], $attributes));
}

/** Re-read an entry including trashed rows, so the tests see the stored state. */
function cmsFresh(ContentEntry $entry): ContentEntry
{
    return ContentEntry::withTrashed()->findOrFail($entry->id);
}

/** The fields the edit form posts, with the entry's current values unless overridden. */
function cmsEntryPayload(ContentEntry $entry, array $overrides = []): array
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

/* Edit form */

test('an editor can open the edit form of any entry', function () {
    $entry = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->get(route('admin.content.edit', ['type' => 'page', 'entry' => $entry]))
        ->assertOk();
});

test('an author can open the edit form of their own entry but not of another author\'s', function () {
    $author = cmsAuthor();
    $own = cmsPage($author);
    $others = cmsPage(User::factory()->create());

    $this->actingAs($author)
        ->get(route('admin.content.edit', ['type' => 'page', 'entry' => $own]))
        ->assertOk();

    $this->actingAs($author)
        ->get(route('admin.content.edit', ['type' => 'page', 'entry' => $others]))
        ->assertForbidden();
});

test('the edit form needs the content view permission', function () {
    $entry = cmsPage(User::factory()->create());
    $userWithoutView = cmsUserWith([Rbac::PERMISSION_CONTENT_EDIT_ANY]);

    $this->actingAs($userWithoutView)
        ->get(route('admin.content.edit', ['type' => 'page', 'entry' => $entry]))
        ->assertForbidden();
});

test('guests are sent to log in before they can open the edit form', function () {
    $entry = cmsPage();

    $this->get(route('admin.content.edit', ['type' => 'page', 'entry' => $entry]))
        ->assertRedirect(route('login'));
});

test('the edit form returns 404 for an unknown entry and for an entry of another type', function () {
    $editor = cmsEditor();
    $post = ContentEntry::factory()->post()->create();

    $this->actingAs($editor)
        ->get(route('admin.content.edit', ['type' => 'page', 'entry' => 999999]))
        ->assertNotFound();

    $this->actingAs($editor)
        ->get(route('admin.content.edit', ['type' => 'page', 'entry' => $post]))
        ->assertNotFound();
});

/* Update */

test('an editor can update any entry', function () {
    $entry = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->put(route('admin.content.update', ['type' => 'page', 'entry' => $entry]), cmsEntryPayload($entry))
        ->assertRedirect();

    expect(cmsFresh($entry)->title)->toBe('Changed by the test');
});

test('an author can update their own entry', function () {
    $author = cmsAuthor();
    $entry = cmsPage($author);

    $this->actingAs($author)
        ->put(route('admin.content.update', ['type' => 'page', 'entry' => $entry]), cmsEntryPayload($entry))
        ->assertRedirect();

    expect(cmsFresh($entry)->title)->toBe('Changed by the test');
});

test('an author cannot update another author\'s entry', function () {
    $entry = cmsPage(User::factory()->create(), ['title' => 'Original']);

    $this->actingAs(cmsAuthor())
        ->put(route('admin.content.update', ['type' => 'page', 'entry' => $entry]), cmsEntryPayload($entry))
        ->assertForbidden();

    expect(cmsFresh($entry)->title)->toBe('Original');
});

test('an author cannot update an entry that has no author', function () {
    $entry = cmsPage(null, ['title' => 'Original']);

    $this->actingAs(cmsAuthor())
        ->put(route('admin.content.update', ['type' => 'page', 'entry' => $entry]), cmsEntryPayload($entry))
        ->assertForbidden();

    expect(cmsFresh($entry)->title)->toBe('Original');
});

test('an author cannot publish a draft through the edit form', function () {
    $author = cmsAuthor();
    $entry = cmsPage($author, ['status' => ContentEntry::STATUS_DRAFT, 'published_at' => null]);

    $this->actingAs($author)
        ->put(
            route('admin.content.update', ['type' => 'page', 'entry' => $entry]),
            cmsEntryPayload($entry, ['status' => ContentEntry::STATUS_PUBLISHED]),
        )
        ->assertSessionHasErrors('status');

    expect(cmsFresh($entry)->status)->toBe(ContentEntry::STATUS_DRAFT);
});

test('an author can edit a live entry without changing its status', function () {
    $author = cmsAuthor();
    $entry = cmsPage($author);

    $this->actingAs($author)
        ->put(
            route('admin.content.update', ['type' => 'page', 'entry' => $entry]),
            cmsEntryPayload($entry, ['status' => ContentEntry::STATUS_PUBLISHED]),
        )
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(cmsFresh($entry))
        ->title->toBe('Changed by the test')
        ->status->toBe(ContentEntry::STATUS_PUBLISHED);
});

test('a user without edit permission cannot update an entry', function () {
    $entry = cmsPage(User::factory()->create(), ['title' => 'Original']);
    $viewOnly = cmsUserWith([Rbac::PERMISSION_CONTENT_VIEW]);

    $this->actingAs($viewOnly)
        ->put(route('admin.content.update', ['type' => 'page', 'entry' => $entry]), cmsEntryPayload($entry))
        ->assertForbidden();

    expect(cmsFresh($entry)->title)->toBe('Original');
});

test('a guest updating an entry is sent to log in and the entry is unchanged', function () {
    $entry = cmsPage(User::factory()->create(), ['title' => 'Original']);

    $this->assertGuest();

    $this->put(route('admin.content.update', ['type' => 'page', 'entry' => $entry]), cmsEntryPayload($entry))
        ->assertRedirect(route('login'));

    expect(cmsFresh($entry)->title)->toBe('Original');
});

test('a guest updating an entry as JSON gets 401 and the entry is unchanged', function () {
    $entry = cmsPage(User::factory()->create(), ['title' => 'Original']);

    $this->assertGuest();

    $this->putJson(route('admin.content.update', ['type' => 'page', 'entry' => $entry]), cmsEntryPayload($entry))
        ->assertUnauthorized();

    expect(cmsFresh($entry)->title)->toBe('Original');
});

test('a trashed entry cannot be updated until it is restored', function () {
    $editor = cmsEditor();
    $entry = cmsPage(User::factory()->create(), ['title' => 'Original']);
    $entry->delete();

    $this->actingAs($editor)
        ->put(route('admin.content.update', ['type' => 'page', 'entry' => $entry]), cmsEntryPayload($entry))
        ->assertSessionHasErrors('title');

    expect(cmsFresh($entry)->title)->toBe('Original');
    expect(cmsFresh($entry)->trashed())->toBeTrue();
});

test('updating an entry through another content type returns 404', function () {
    $post = ContentEntry::factory()->post()->create(['title' => 'Original']);

    $this->actingAs(cmsEditor())
        ->put(route('admin.content.update', ['type' => 'page', 'entry' => $post]), cmsEntryPayload($post))
        ->assertNotFound();

    expect(cmsFresh($post)->title)->toBe('Original');
});

/* Publish, bulk */

test('an editor can publish drafts in bulk', function () {
    $drafts = ContentEntry::factory()->page()->draft()->count(2)->create();

    $this->actingAs(cmsEditor())
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'publish',
            'ids' => $drafts->pluck('id')->all(),
        ])
        ->assertRedirect();

    foreach ($drafts as $draft) {
        expect(cmsFresh($draft))
            ->status->toBe(ContentEntry::STATUS_PUBLISHED)
            ->published_at->not->toBeNull();
    }
});

test('an author without publish permission cannot bulk publish, even their own drafts', function () {
    $author = cmsAuthor();
    $drafts = ContentEntry::factory()->page()->draft()->count(2)->create(['author_id' => $author->id]);

    $this->actingAs($author)
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'publish',
            'ids' => $drafts->pluck('id')->all(),
        ])
        ->assertForbidden();

    foreach ($drafts as $draft) {
        expect(cmsFresh($draft)->status)->toBe(ContentEntry::STATUS_DRAFT);
    }
});

test('a bulk publish is refused for every entry when one of them is not editable', function () {
    $author = cmsPublishingAuthor();
    $own = ContentEntry::factory()->page()->draft()->create(['author_id' => $author->id]);
    $others = ContentEntry::factory()->page()->draft()->create(['author_id' => User::factory()->create()->id]);

    $this->actingAs($author)
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'publish',
            'ids' => [$own->id, $others->id],
        ])
        ->assertForbidden();

    expect(cmsFresh($own)->status)->toBe(ContentEntry::STATUS_DRAFT);
    expect(cmsFresh($others)->status)->toBe(ContentEntry::STATUS_DRAFT);
});

test('bulk trash moves the selected entries to the trash and leaves the others alone', function () {
    $selected = collect([
        cmsPage(User::factory()->create()),
        cmsPage(User::factory()->create()),
    ]);
    $untouched = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'trash',
            'ids' => $selected->pluck('id')->all(),
        ])
        ->assertRedirect();

    foreach ($selected as $entry) {
        expect(cmsFresh($entry)->trashed())->toBeTrue();
    }

    expect(cmsFresh($untouched)->trashed())->toBeFalse();
});

test('an author without delete permission cannot bulk trash entries', function () {
    $author = cmsAuthor();
    $own = cmsPage($author);

    $this->actingAs($author)
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'trash',
            'ids' => [$own->id],
        ])
        ->assertForbidden();

    expect(cmsFresh($own)->trashed())->toBeFalse();
});

test('bulk restore only restores trashed entries among those selected', function () {
    $trashed = cmsPage(User::factory()->create());
    $trashed->delete();
    $live = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'restore',
            'ids' => [$trashed->id, $live->id],
        ])
        ->assertRedirect();

    expect(cmsFresh($trashed)->trashed())->toBeFalse();
    expect(cmsFresh($live)->trashed())->toBeFalse();
    expect(cmsFresh($live)->status)->toBe(ContentEntry::STATUS_PUBLISHED);
});

test('bulk permanent delete removes only trashed entries', function () {
    $trashed = cmsPage(User::factory()->create());
    $trashed->delete();
    $live = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'forceDelete',
            'ids' => [$trashed->id, $live->id],
        ])
        ->assertRedirect();

    expect(ContentEntry::withTrashed()->find($trashed->id))->toBeNull();
    expect(cmsFresh($live))->not->toBeNull();
});

test('bulk actions refuse entries that are not of this content type, and change nothing', function () {
    $page = cmsPage(User::factory()->create());
    $post = ContentEntry::factory()->post()->create();

    $this->actingAs(cmsEditor())
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'trash',
            'ids' => [$page->id, $post->id],
        ])
        ->assertNotFound();

    expect(cmsFresh($page)->trashed())->toBeFalse();
    expect(cmsFresh($post)->trashed())->toBeFalse();
});

test('bulk actions reject an unknown action', function () {
    $entry = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->post(route('admin.content.bulk', ['type' => 'page']), [
            'action' => 'destroy-everything',
            'ids' => [$entry->id],
        ])
        ->assertSessionHasErrors('action');

    expect(cmsFresh($entry)->trashed())->toBeFalse();
});

test('bulk actions need the content view permission', function () {
    $entry = cmsPage(User::factory()->create());
    $payload = ['action' => 'trash', 'ids' => [$entry->id]];

    $this->actingAs(cmsUserWith([Rbac::PERMISSION_CONTENT_DELETE]))
        ->post(route('admin.content.bulk', ['type' => 'page']), $payload)
        ->assertForbidden();

    expect(cmsFresh($entry)->trashed())->toBeFalse();
});

test('a guest submitting a bulk action is sent to log in and nothing is trashed', function () {
    $entry = cmsPage(User::factory()->create());
    $payload = ['action' => 'trash', 'ids' => [$entry->id]];

    $this->assertGuest();

    $this->post(route('admin.content.bulk', ['type' => 'page']), $payload)
        ->assertRedirect(route('login'));

    expect(cmsFresh($entry)->trashed())->toBeFalse();
});

test('a guest submitting a bulk action as JSON gets 401 and nothing is trashed', function () {
    $entry = cmsPage(User::factory()->create());
    $payload = ['action' => 'trash', 'ids' => [$entry->id]];

    $this->assertGuest();

    $this->postJson(route('admin.content.bulk', ['type' => 'page']), $payload)
        ->assertUnauthorized();

    expect(cmsFresh($entry)->trashed())->toBeFalse();
});

/* Restore from the trash */

test('an editor can restore a trashed entry', function () {
    $entry = cmsPage(User::factory()->create());
    $entry->delete();

    $this->actingAs(cmsEditor())
        ->post(route('admin.content.restore', ['type' => 'page', 'entry' => $entry]))
        ->assertRedirect();

    expect(cmsFresh($entry)->trashed())->toBeFalse();
});

test('an author cannot restore their own trashed entry', function () {
    $author = cmsAuthor();
    $entry = cmsPage($author);
    $entry->delete();

    $this->actingAs($author)
        ->post(route('admin.content.restore', ['type' => 'page', 'entry' => $entry]))
        ->assertForbidden();

    expect(cmsFresh($entry)->trashed())->toBeTrue();
});

test('restore is refused for an entry that is not in the trash', function () {
    $entry = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->post(route('admin.content.restore', ['type' => 'page', 'entry' => $entry]))
        ->assertUnprocessable();

    expect(cmsFresh($entry)->trashed())->toBeFalse();
});

/* Trash and permanent delete */

test('an editor can move an entry to the trash without deleting its row', function () {
    $entry = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->delete(route('admin.content.destroy', ['type' => 'page', 'entry' => $entry]))
        ->assertRedirect();

    expect(cmsFresh($entry)->trashed())->toBeTrue();
});

test('an author cannot move an entry to the trash, not even their own', function () {
    $author = cmsAuthor();
    $entry = cmsPage($author);

    $this->actingAs($author)
        ->delete(route('admin.content.destroy', ['type' => 'page', 'entry' => $entry]))
        ->assertForbidden();

    expect(cmsFresh($entry)->trashed())->toBeFalse();
});

test('permanent delete removes a trashed entry for good', function () {
    $entry = cmsPage(User::factory()->create());
    $entry->delete();

    $this->actingAs(cmsEditor())
        ->delete(route('admin.content.force-destroy', ['type' => 'page', 'entry' => $entry]))
        ->assertRedirect();

    expect(ContentEntry::withTrashed()->find($entry->id))->toBeNull();
});

test('permanent delete refuses an entry that is not in the trash', function () {
    $entry = cmsPage(User::factory()->create());

    $this->actingAs(cmsEditor())
        ->delete(route('admin.content.force-destroy', ['type' => 'page', 'entry' => $entry]))
        ->assertUnprocessable();

    expect(cmsFresh($entry))->not->toBeNull();
});

test('an author cannot permanently delete their own trashed entry', function () {
    $author = cmsAuthor();
    $entry = cmsPage($author);
    $entry->delete();

    $this->actingAs($author)
        ->delete(route('admin.content.force-destroy', ['type' => 'page', 'entry' => $entry]))
        ->assertForbidden();

    expect(cmsFresh($entry))->not->toBeNull();
});
