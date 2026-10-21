<?php

use App\Models\AuditLog;
use App\Models\User;
use App\Support\Rbac;

beforeEach(function () {
    Rbac::sync();
});

function adminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('a suspended user cannot sign in with the right password', function () {
    $user = User::factory()->create(['password' => 'secret-password', 'suspended_at' => now()]);

    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('a suspension ends a session that is already open', function () {
    $user = User::factory()->create(['suspended_at' => now()]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});

test('an admin cannot suspend their own account or the last active admin', function () {
    $admin = adminUser();

    $this->actingAs($admin)
        ->post(route('admin.users.suspend', $admin))
        ->assertSessionHasErrors('user');

    expect($admin->fresh()->isSuspended())->toBeFalse();
});

test('an admin can suspend and reinstate another user, and both are recorded', function () {
    $admin = adminUser();
    $target = User::factory()->create();

    $this->actingAs($admin)->post(route('admin.users.suspend', $target))->assertRedirect();
    expect($target->fresh()->isSuspended())->toBeTrue();

    $this->actingAs($admin)->post(route('admin.users.reinstate', $target))->assertRedirect();
    expect($target->fresh()->isSuspended())->toBeFalse();

    expect(AuditLog::query()->whereIn('action', ['user.suspended', 'user.reinstated'])->count())->toBe(2);
});

test('an admin cannot delete themselves or the last admin', function () {
    $admin = adminUser();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertSessionHasErrors('user');

    expect(User::query()->whereKey($admin->id)->exists())->toBeTrue();
});

test('deleting a user removes them and records the deletion with their email', function () {
    $admin = adminUser();
    $target = User::factory()->create();
    $email = $target->email;

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $target))
        ->assertRedirect(route('admin.users.index'));

    expect(User::query()->whereKey($target->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('action', 'user.deleted')->value('subject_label'))->toBe($email);
});

test('an admin can impersonate a user, and stopping returns them to their own account', function () {
    $admin = adminUser();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.impersonate', $target))
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($target);

    $entry = AuditLog::query()->where('action', 'user.impersonation_started')->firstOrFail();
    expect($entry->actor_id)->toBe($admin->id)
        ->and($entry->subject_id)->toBe($target->id);

    $this->post(route('impersonation.stop'))->assertRedirect(route('admin.users.index'));

    $this->assertAuthenticatedAs($admin);
    expect(AuditLog::query()->where('action', 'user.impersonation_stopped')->exists())->toBeTrue();
});

test('admins cannot be impersonated', function () {
    $admin = adminUser();
    $otherAdmin = adminUser();

    $this->actingAs($admin)
        ->post(route('admin.users.impersonate', $otherAdmin))
        ->assertSessionHasErrors('user');

    $this->assertAuthenticatedAs($admin);
});

test('a user without users.manage cannot open the admin user list or export', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin.users.index'))->assertForbidden();
    $this->actingAs($user)->get(route('admin.users.export'))->assertForbidden();
});

test('the CSV export lists every account and is recorded', function () {
    $admin = adminUser();
    User::factory()->create(['name' => '=HYPERLINK("x")']);

    $response = $this->actingAs($admin)->get(route('admin.users.export'));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('text/csv');
    expect($response->streamedContent())->toContain('id,name,email,role')
        ->and($response->streamedContent())->toContain("'=HYPERLINK");
    expect(AuditLog::query()->where('action', 'user.exported')->exists())->toBeTrue();
});

test('changing the email clears verification, and verifying marks it done', function () {
    $admin = adminUser();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $target), ['name' => 'New Name', 'email' => 'new@example.com'])
        ->assertRedirect();

    expect($target->fresh()->email_verified_at)->toBeNull();

    $this->actingAs($admin)
        ->post(route('admin.users.verify-email', $target))
        ->assertRedirect();

    expect($target->fresh()->email_verified_at)->not->toBeNull();
});
