<?php

use App\Models\Task;
use App\Models\User;
use App\Support\Rbac;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Rbac::sync();
});

function admin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('new accounts get the default role and no extra permissions', function () {
    $user = User::factory()->create();

    expect($user->hasRole(Rbac::DEFAULT_ROLE))->toBeTrue()
        ->and($user->getAllPermissions())->toBeEmpty();
});

test('the admin role has every permission', function () {
    expect(admin()->getAllPermissions()->pluck('name')->all())->toEqualCanonicalizing(Rbac::permissions());
});

test('a regular user only sees their own tasks', function () {
    $user = User::factory()->create();
    $mine = Task::factory()->for($user)->create();
    Task::factory()->create();

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertInertia(fn ($page) => $page
            ->component('tasks')
            ->where('showOwner', false)
            ->has('tasks', 1)
            ->where('tasks.0.id', $mine->id));
});

test('an admin sees every task with its owner', function () {
    Task::factory()->count(2)->create();

    $this->actingAs(admin())
        ->get(route('tasks.index'))
        ->assertInertia(fn ($page) => $page
            ->component('tasks')
            ->where('showOwner', true)
            ->has('tasks', 2)
            ->has('tasks.0.owner'));
});

test('a user cannot update or delete someone else\'s task', function () {
    // Pin the label: the factory picks one at random, and it could already be 'bug'.
    $task = Task::factory()->create(['label' => 'feature']);
    $other = User::factory()->create();

    $this->actingAs($other)
        ->patch(route('tasks.update', $task), ['label' => 'bug'])
        ->assertForbidden();

    $this->actingAs($other)
        ->delete(route('tasks.destroy', $task))
        ->assertForbidden();

    expect($task->fresh()->label)->not->toBe('bug');
});

test('an admin can update and delete any task', function () {
    $task = Task::factory()->create(['label' => 'feature']);

    $this->actingAs(admin())
        ->patch(route('tasks.update', $task), ['label' => 'bug'])
        ->assertRedirect();

    expect($task->fresh()->label)->toBe('bug');

    $this->actingAs(admin())
        ->delete(route('tasks.destroy', $task))
        ->assertRedirect();

    expect(Task::count())->toBe(0);
});

test('only users with the users.view permission can open the users page', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('users.index'))
        ->assertForbidden();

    $this->actingAs(admin())
        ->get(route('users.index'))
        ->assertOk();
});

test('an admin can change another user\'s role', function () {
    $target = User::factory()->create();

    $this->actingAs(admin())
        ->patch(route('users.role.update', $target), ['role' => 'admin'])
        ->assertRedirect(route('users.index'));

    expect($target->fresh()->hasRole('admin'))->toBeTrue()
        ->and($target->fresh()->roles()->count())->toBe(1);
});

test('an admin cannot change their own role', function () {
    $admin = admin();

    $this->actingAs($admin)
        ->patch(route('users.role.update', $admin), ['role' => 'user'])
        ->assertSessionHasErrors('role');

    expect($admin->fresh()->hasRole('admin'))->toBeTrue();
});

test('the last admin cannot be demoted', function () {
    $lastAdmin = admin();

    // Only the admin role can manage roles by default, so a manager role with the same
    // permissions is used. It is not an admin, which lets it reach the guard.
    $manager = User::factory()->create();
    $role = Role::findOrCreate('manager');
    $role->syncPermissions([Rbac::PERMISSION_USERS_VIEW, Rbac::PERMISSION_USERS_MANAGE_ROLES]);
    $manager->syncRoles($role);

    $this->actingAs($manager)
        ->patch(route('users.role.update', $lastAdmin), ['role' => 'user'])
        ->assertSessionHasErrors('role');

    expect($lastAdmin->fresh()->hasRole('admin'))->toBeTrue();
});

test('a user cannot change roles', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('users.role.update', $target), ['role' => 'admin'])
        ->assertForbidden();

    expect($target->fresh()->hasRole('admin'))->toBeFalse();
});

test('an admin can give several users the same role at once', function () {
    $first = User::factory()->create();
    $second = User::factory()->create();

    $this->actingAs(admin())
        ->patch(route('users.role.bulk'), ['ids' => [$first->id, $second->id], 'role' => 'admin'])
        ->assertRedirect(route('users.index'));

    expect($first->fresh()->hasRole('admin'))->toBeTrue()
        ->and($second->fresh()->hasRole('admin'))->toBeTrue();
});

test('a bulk role change cannot include the admin doing it', function () {
    $admin = admin();
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->patch(route('users.role.bulk'), ['ids' => [$admin->id, $target->id], 'role' => 'user'])
        ->assertSessionHasErrors('role');

    expect($admin->fresh()->hasRole('admin'))->toBeTrue()
        ->and($target->fresh()->hasRole('admin'))->toBeFalse();
});

test('a bulk role change cannot remove the last admin', function () {
    $lastAdmin = admin();

    $manager = User::factory()->create();
    $role = Role::findOrCreate('manager');
    $role->syncPermissions([Rbac::PERMISSION_USERS_VIEW, Rbac::PERMISSION_USERS_MANAGE_ROLES]);
    $manager->syncRoles($role);

    $this->actingAs($manager)
        ->patch(route('users.role.bulk'), ['ids' => [$lastAdmin->id], 'role' => 'user'])
        ->assertSessionHasErrors('role');

    expect($lastAdmin->fresh()->hasRole('admin'))->toBeTrue();
});

test('an admin can create a role with the permissions they pick', function () {
    // The CMS creates the editor and author roles, so this role needs a name of its own.
    $this->actingAs(admin())
        ->post(route('admin.roles.store'), [
            'name' => 'reviewer',
            'permissions' => [Rbac::PERMISSION_TASKS_VIEW_ANY],
        ])
        ->assertRedirect(route('admin.roles.index'));

    expect(Role::findByName('reviewer')->permissions->pluck('name')->all())
        ->toBe([Rbac::PERMISSION_TASKS_VIEW_ANY]);
});

test('a user cannot manage roles or permissions', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin.roles.index'))->assertForbidden();
    $this->actingAs($user)->post(route('admin.roles.store'), ['name' => 'editor'])->assertForbidden();
    $this->actingAs($user)->get(route('admin.permissions.index'))->assertForbidden();
});

test('the admin and user roles cannot be deleted', function () {
    $this->actingAs(admin())
        ->delete(route('admin.roles.destroy', Role::findByName('user')))
        ->assertForbidden();

    $this->actingAs(admin())
        ->delete(route('admin.roles.destroy', Role::findByName('admin')))
        ->assertForbidden();
});

test('a role that still has users cannot be deleted', function () {
    $role = Role::findOrCreate('editor');
    User::factory()->create()->assignRole($role);

    $this->actingAs(admin())
        ->delete(route('admin.roles.destroy', $role))
        ->assertSessionHasErrors('role');

    expect(Role::where('name', 'editor')->exists())->toBeTrue();
});

test('the admin role keeps every permission when it is saved', function () {
    $this->actingAs(admin())
        ->patch(route('admin.roles.update', Role::findByName('admin')), [
            'name' => 'admin',
            'permissions' => [],
        ])
        ->assertRedirect(route('admin.roles.index'));

    expect(Role::findByName('admin')->permissions->pluck('name')->sort()->values()->all())
        ->toEqual(collect(Rbac::permissions())->sort()->values()->all());
});

test('the permissions page is read-only', function () {
    $this->actingAs(admin())
        ->get(route('admin.permissions.index'))
        ->assertOk();

    // Permissions are defined in code, so there is no route to create, rename or delete them.
    $this->actingAs(admin())
        ->post('/admin/permissions', ['name' => 'reports.export'])
        ->assertMethodNotAllowed();
});

test('a user who can only view users cannot change roles', function () {
    $viewer = User::factory()->create();
    $role = Role::findOrCreate('viewer');
    $role->syncPermissions([Rbac::PERMISSION_USERS_VIEW]);
    $viewer->syncRoles($role);

    $target = User::factory()->create();

    $this->actingAs($viewer)
        ->patch(route('users.role.update', $target), ['role' => 'admin'])
        ->assertForbidden();

    $this->actingAs($viewer)
        ->patch(route('users.role.bulk'), ['ids' => [$target->id], 'role' => 'admin'])
        ->assertForbidden();

    expect($target->fresh()->hasRole('admin'))->toBeFalse();
});
