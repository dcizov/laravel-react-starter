import {
    BookOpen,
    KeyRound,
    LayoutTemplate,
    ListChecks,
    FolderGit2,
    LayoutGrid,
    ScrollText,
    Settings,
    ShieldCheck,
    UserCog,
    UserRound,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { index as indexAuditLog } from '@/routes/admin/audit-log';
import { index as indexAdminLanding } from '@/routes/admin/landing';
import { index as indexAdminPermissions } from '@/routes/admin/permissions';
import { index as indexAdminRoles } from '@/routes/admin/roles';
import { index as indexAdminUsers } from '@/routes/admin/users';
import { index as indexTasks } from '@/routes/tasks';
import { show as showUserProfile } from '@/routes/user-profile';
import { index as indexUsers } from '@/routes/users';
import type { NavItem } from '@/types';
import { dashboard } from '@/routes';

export type SidebarLink = NavItem & {
    id: string;
    icon: LucideIcon;
    // The Gate ability the user needs to see the link. Links without one are open to everyone.
    permission?: string;
    // Only shown while the public landing page is switched on in admin settings.
    needsLandingPage?: boolean;
};

export type SidebarEntry = SidebarLink;

export type SidebarGroupDef = {
    title: string;
    items: SidebarEntry[];
};

// The ids must match App\Support\DisplaySettings::ITEMS on the server.
// The sidebar and the Display settings page both read from this structure.
export const sidebarGroups: SidebarGroupDef[] = [
    {
        title: 'General',
        items: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                id: 'user-profile',
                title: 'User profile',
                href: showUserProfile(),
                icon: UserRound,
            },
            {
                id: 'tasks',
                title: 'Tasks',
                href: indexTasks(),
                icon: ListChecks,
            },
            {
                id: 'users',
                title: 'Users',
                href: indexUsers(),
                icon: Users,
                permission: 'users.view',
            },
        ],
    },
    {
        title: 'Others',
        items: [
            {
                id: 'settings',
                title: 'Settings',
                href: '/settings',
                icon: Settings,
            },
        ],
    },
    {
        // Only shown to users with the matching permission. Each link checks its own permission.
        title: 'Admin',
        items: [
            {
                id: 'admin-roles',
                title: 'Roles',
                href: indexAdminRoles(),
                icon: ShieldCheck,
                permission: 'roles.manage',
            },
            {
                id: 'admin-permissions',
                title: 'Permissions',
                href: indexAdminPermissions(),
                icon: KeyRound,
                permission: 'permissions.manage',
            },
            {
                id: 'admin-users',
                title: 'Manage users',
                href: indexAdminUsers(),
                icon: UserCog,
                permission: 'users.manage',
            },
            {
                id: 'audit-log',
                title: 'Audit log',
                href: indexAuditLog(),
                icon: ScrollText,
                permission: 'audit.view',
            },
            {
                id: 'admin-landing',
                title: 'Visual Editor',
                href: indexAdminLanding(),
                icon: LayoutTemplate,
                permission: 'landing.manage',
                needsLandingPage: true,
            },
        ],
    },
    {
        title: 'Resources',
        items: [
            {
                id: 'repository',
                title: 'Repository',
                href: 'https://github.com/laravel/react-starter-kit',
                icon: FolderGit2,
            },
            {
                id: 'documentation',
                title: 'Documentation',
                href: 'https://laravel.com/docs/starter-kits#react',
                icon: BookOpen,
            },
        ],
    },
];

// Every linkable item in display order. The Display settings page lists these, grouped by sidebarGroups.
export const displayGroups = sidebarGroups.map((group) => ({
    title: group.title,
    items: group.items.map(({ id, title }) => ({ id, title })),
}));

// The groups the user chose in Display settings. Empty groups and submenus are dropped.
// Links the user has no permission for are dropped, whatever Display settings say.
export function visibleSidebarGroups(
    displayItems: string[],
    permissions: string[],
    landingEnabled: boolean,
): SidebarGroupDef[] {
    const allowed = (link: SidebarLink) =>
        displayItems.includes(link.id) &&
        (!link.permission || permissions.includes(link.permission)) &&
        (!link.needsLandingPage || landingEnabled);

    return sidebarGroups
        .map((group): SidebarGroupDef => ({
            ...group,
            items: group.items.filter(allowed),
        }))
        .filter((group) => group.items.length > 0);
}

// Every visible link in order.
export function flattenSidebarLinks(groups: SidebarGroupDef[]): SidebarLink[] {
    return groups.flatMap((group) => group.items);
}
