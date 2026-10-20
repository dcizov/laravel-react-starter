<?php

use App\Models\Task;
use App\Models\User;
use App\Support\Rbac;
use Spatie\Permission\Models\Permission;
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
    expect(admin()->getAllPermissions()->pluck('name')->all())->toEqualCanonicalizing(Rbac::PERMISSIONS);
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
    $task = Task::factory()->create();
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

test('an admin can create a role with the permissions they pick', function () {
    $this->actingAs(admin())
        ->post(route('admin.roles.store'), [
            'name' => 'editor',
            'permissions' => [Rbac::PERMISSION_TASKS_VIEW_ANY],
        ])
        ->assertRedirect(route('admin.roles.index'));

    expect(Role::findByName('editor')->permissions->pluck('name')->all())
        ->toBe([Rbac::PERMISSION_TASKS_VIEW_ANY]);
});

test('a user cannot manage roles or permissions', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin.roles.index'))->assertForbidden();
    $this->actingAs($user)->post(route('admin.roles.store'), ['name' => 'editor'])->assertForbidden();
    $this->actingAs($user)->get(route('admin.permissions.index'))->assertForbidden();
    $this->actingAs($user)->post(route('admin.permissions.store'), ['name' => 'reports.export'])->assertForbidden();
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
        ->toEqual(collect(Rbac::PERMISSIONS)->sort()->values()->all());
});

test('a custom permission is created and the admin role gets it', function () {
    $this->actingAs(admin())
        ->post(route('admin.permissions.store'), ['name' => 'reports.export'])
        ->assertRedirect(route('admin.permissions.index'));

    expect(Role::findByName('admin')->permissions->pluck('name'))->toContain('reports.export');
});

test('built-in permissions cannot be renamed or deleted', function () {
    $permission = Permission::findByName(Rbac::PERMISSION_TASKS_VIEW_ANY);

    $this->actingAs(admin())
        ->patch(route('admin.permissions.update', $permission), ['name' => 'tasks.all'])
        ->assertForbidden();

    $this->actingAs(admin())
        ->delete(route('admin.permissions.destroy', $permission))
        ->assertForbidden();
});

test('a custom permission that is still on a role cannot be deleted', function () {
    $permission = Permission::findOrCreate('reports.export');
    Role::findByName('user')->givePermissionTo($permission);

    $this->actingAs(admin())
        ->delete(route('admin.permissions.destroy', $permission))
        ->assertSessionHasErrors('name');

    expect(Permission::where('name', 'reports.export')->exists())->toBeTrue();
});
