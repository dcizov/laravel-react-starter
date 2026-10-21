<?php

namespace App\Support;

use App\Features\FeatureRegistry;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class Rbac
{
    public const PERMISSION_TASKS_VIEW_ANY = 'tasks.view-any';

    public const PERMISSION_TASKS_UPDATE_ANY = 'tasks.update-any';

    public const PERMISSION_TASKS_DELETE_ANY = 'tasks.delete-any';

    public const PERMISSION_USERS_VIEW = 'users.view';

    public const PERMISSION_USERS_MANAGE_ROLES = 'users.manage-roles';

    // Edit, verify, suspend, delete, and export users on the admin Users page.
    public const PERMISSION_USERS_MANAGE = 'users.manage';

    // Sign in as another user, for support. Recorded in the audit log.
    public const PERMISSION_USERS_IMPERSONATE = 'users.impersonate';

    public const PERMISSION_AUDIT_VIEW = 'audit.view';

    public const PERMISSION_ROLES_MANAGE = 'roles.manage';

    public const PERMISSION_PERMISSIONS_MANAGE = 'permissions.manage';

    public const PERMISSION_SETTINGS_MANAGE = 'settings.manage';

    public const PERMISSION_LANDING_MANAGE = 'landing.manage';

    public const PERMISSION_NEWSLETTER_MANAGE = 'newsletter.manage';

    public const PERMISSION_INTEGRATIONS_MANAGE = 'integrations.manage';

    // Pages, custom post types, posts, CTAs and taxonomies (the cms feature).
    public const PERMISSION_CONTENT_MANAGE = 'content.manage';

    // Comment moderation (the blog feature).
    public const PERMISSION_BLOG_MANAGE = 'blog.manage';

    // Site-wide SEO settings (the seo feature).
    public const PERMISSION_SEO_MANAGE = 'seo.manage';

    /**
     * The permissions of the core app. Feature permissions are added by permissions(), while the feature is enabled.
     *
     * @var list<string>
     */
    public const CORE_PERMISSIONS = [
        self::PERMISSION_TASKS_VIEW_ANY,
        self::PERMISSION_TASKS_UPDATE_ANY,
        self::PERMISSION_TASKS_DELETE_ANY,
        self::PERMISSION_USERS_VIEW,
        self::PERMISSION_USERS_MANAGE_ROLES,
        self::PERMISSION_USERS_MANAGE,
        self::PERMISSION_USERS_IMPERSONATE,
        self::PERMISSION_AUDIT_VIEW,
        self::PERMISSION_ROLES_MANAGE,
        self::PERMISSION_PERMISSIONS_MANAGE,
        self::PERMISSION_SETTINGS_MANAGE,
    ];

    /**
     * The permissions that exist right now: the core ones plus those of the enabled features.
     *
     * @return list<string>
     */
    public static function permissions(): array
    {
        return array_values(array_unique([
            ...self::CORE_PERMISSIONS,
            ...app(FeatureRegistry::class)->permissions(),
        ]));
    }

    /**
     * The roles and the permissions each one has.
     *
     * @return array<string, list<string>>
     */
    public static function roles(): array
    {
        return [
            'admin' => self::permissions(),
            'user' => [],
        ];
    }

    /**
     * Roles the app depends on. They cannot be renamed or deleted, and the admin role always has every permission.
     *
     * @var list<string>
     */
    public const SYSTEM_ROLES = ['admin', 'user'];

    /**
     * The role every new account gets.
     */
    public const DEFAULT_ROLE = 'user';

    /**
     * Create the permissions and roles above, and give each role exactly the permissions listed here.
     */
    public static function sync(): void
    {
        $registrar = app(PermissionRegistrar::class);

        foreach (self::permissions() as $name) {
            Permission::findOrCreate($name);
        }

        // Spatie caches the permission list. Clear it so the roles below see the rows just created.
        $registrar->forgetCachedPermissions();

        foreach (self::roles() as $name => $permissions) {
            Role::findOrCreate($name)->syncPermissions($permissions);
        }

        $registrar->forgetCachedPermissions();
    }

    /**
     * Bring the permissions in line with the enabled features after one is switched on or off. Only the
     * permission rows and the admin role change. Other roles are left alone, so edits made in the roles screen survive.
     */
    public static function syncFeaturePermissions(): void
    {
        $registrar = app(PermissionRegistrar::class);

        foreach (self::permissions() as $name) {
            Permission::findOrCreate($name);
        }

        $registrar->forgetCachedPermissions();

        Role::findOrCreate('admin')->syncPermissions(self::permissions());

        $registrar->forgetCachedPermissions();
    }
}
