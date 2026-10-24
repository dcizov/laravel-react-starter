<?php

use App\Models\Invitation;
use App\Models\User;
use App\Notifications\InvitationNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');
});

it('lets an admin list users with roles', function () {
    $this->actingAs($this->admin)
        ->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.data', 3)
            ->has('roles'));
});

it('forbids an author from opening the users screen', function () {
    $this->actingAs($this->author)->get('/admin/users')->assertForbidden();
});

it('lets an editor view the team but not manage it', function () {
    $this->actingAs($this->editor)
        ->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('can.manage', false));

    $this->actingAs($this->editor)
        ->patch("/admin/users/{$this->author->id}", ['role' => 'Admin'])
        ->assertForbidden();
});

it('invites a teammate and emails them a signed link', function () {
    Notification::fake();

    $this->actingAs($this->admin)
        ->post('/admin/users/invitations', ['email' => 'new.editor@lattice.test', 'role' => 'Editor'])
        ->assertRedirect();

    $invitation = Invitation::first();

    expect($invitation)->not->toBeNull()
        ->and($invitation->role)->toBe('Editor')
        ->and($invitation->invited_by)->toBe($this->admin->id)
        ->and($invitation->isPending())->toBeTrue();

    Notification::assertSentOnDemand(InvitationNotification::class);
});

it('refuses to invite an existing account', function () {
    $this->actingAs($this->admin)
        ->post('/admin/users/invitations', ['email' => $this->editor->email, 'role' => 'Editor'])
        ->assertSessionHasErrors('email');

    expect(Invitation::count())->toBe(0);
});

it('accepts an invitation and signs the new user in with the invited role', function () {
    ['invitation' => $invitation, 'token' => $token] = Invitation::createFor('fresh@lattice.test', 'Editor', $this->admin);

    $this->get("/invitations/{$token}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/accept-invitation')
            ->where('email', 'fresh@lattice.test')
            ->where('role', 'Editor'));

    $this->post("/invitations/{$token}", [
        'name' => 'Fresh Editor',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('dashboard'));

    $user = User::where('email', 'fresh@lattice.test')->first();

    expect($user)->not->toBeNull()
        ->and($user->hasRole('Editor'))->toBeTrue()
        ->and($this->app['auth']->check())->toBeTrue();

    expect($invitation->refresh()->accepted_at)->not->toBeNull();
});

it('rejects an expired or unknown invitation token', function () {
    ['invitation' => $invitation, 'token' => $token] = Invitation::createFor('late@lattice.test', 'Author', $this->admin);

    $invitation->forceFill(['expires_at' => now()->subDay()])->save();

    $this->get("/invitations/{$token}")->assertNotFound();
    $this->get('/invitations/not-a-real-token')->assertNotFound();
});

it('changes a role and records it in the activity log', function () {
    $this->actingAs($this->admin)
        ->patch("/admin/users/{$this->author->id}", ['role' => 'Editor'])
        ->assertRedirect();

    expect($this->author->refresh()->hasRole('Editor'))->toBeTrue()
        ->and(DB::table('activity_log')->where('log_name', 'users')->count())->toBe(1);
});

it('protects the last active administrator', function () {
    // Demote everyone else so the acting admin is the only one left.
    $this->editor->delete();
    $this->author->delete();

    $this->actingAs($this->admin)
        ->patch("/admin/users/{$this->admin->id}", ['role' => 'Editor'])
        ->assertSessionHasErrors('role');

    $this->actingAs($this->admin)
        ->patch("/admin/users/{$this->admin->id}", ['is_active' => false])
        ->assertSessionHasErrors('is_active');

    expect($this->admin->refresh()->hasRole('Admin'))->toBeTrue()
        ->and($this->admin->is_active)->toBeTrue();
});

it('signs out a deactivated user on their next request', function () {
    $this->editor->forceFill(['is_active' => false])->save();

    $this->actingAs($this->editor->refresh())
        ->get('/admin')
        ->assertRedirect(route('login'));

    $this->assertGuest();
});
