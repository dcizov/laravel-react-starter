import {
    Globe,
    BookOpen,
    FileText,
    FolderGit2,
    KeyRound,
    LayoutGrid,
    LayoutTemplate,
    ListChecks,
    Mail,
    MessageSquare,
    MousePointerClick,
    Newspaper,
    Plug,
    ScrollText,
    Search,
    Settings,
    ShieldCheck,
    Shapes,
    Tags,
    UserCog,
    UserRound,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { index as indexAuditLog } from '@/routes/admin/audit-log';
import { index as indexAdminIntegrations } from '@/routes/admin/integrations';
import { index as indexAdminLanding } from '@/routes/admin/landing';
import { index as indexAdminNewsletter } from '@/routes/admin/newsletter';
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
    // The feature this link belongs to (see config/features.php). Hidden while the feature is switched off.
    feature?: string;
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
                title: 'Visual editor',
                href: indexAdminLanding(),
                icon: LayoutTemplate,
                permission: 'landing.manage',
                feature: 'landing',
            },
            {
                id: 'admin-newsletter',
                title: 'Newsletter',
                href: indexAdminNewsletter(),
                icon: Mail,
                permission: 'newsletter.manage',
                feature: 'newsletter',
            },
            {
                id: 'admin-integrations',
                title: 'Integrations',
                href: indexAdminIntegrations(),
                icon: Plug,
                permission: 'integrations.manage',
                feature: 'integrations',
            },
            // The hrefs below are plain paths; the content routes are feature-owned, so they are not generated.
            {
                id: 'admin-content-pages',
                title: 'Pages',
                href: '/admin/content/page',
                icon: FileText,
                permission: 'content.view',
                feature: 'cms',
            },
            {
                id: 'admin-content-posts',
                title: 'Posts',
                href: '/admin/content/post',
                icon: Newspaper,
                permission: 'content.view',
                feature: 'blog',
            },
            {
                id: 'admin-cms-types',
                title: 'Content types',
                href: '/admin/cms/types',
                icon: Shapes,
                permission: 'settings.manage',
                feature: 'cms',
            },
            {
                id: 'admin-cms-ctas',
                title: 'Calls to action',
                href: '/admin/cms/ctas',
                icon: MousePointerClick,
                permission: 'content.edit-any',
                feature: 'cms',
            },
            {
                id: 'admin-cms-terms',
                title: 'Categories and tags',
                href: '/admin/cms/terms',
                icon: Tags,
                permission: 'content.edit-any',
                feature: 'cms',
            },
            {
                id: 'admin-blog-comments',
                title: 'Comments',
                href: '/admin/blog/comments',
                icon: MessageSquare,
                permission: 'comments.moderate',
                feature: 'cms',
            },
            {
                id: 'admin-sites',
                title: 'Sites',
                href: '/admin/sites',
                icon: Globe,
                permission: 'sites.manage',
            },
            {
                id: 'admin-seo',
                title: 'Search and sharing',
                href: '/admin/seo',
                icon: Search,
                permission: 'seo.manage',
                feature: 'seo',
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
    features: string[],
): SidebarGroupDef[] {
    const allowed = (link: SidebarLink) =>
        displayItems.includes(link.id) &&
        (!link.permission || permissions.includes(link.permission)) &&
        (!link.feature || features.includes(link.feature));

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
