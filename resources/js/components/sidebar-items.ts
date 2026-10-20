import {
    Bell,
    BookOpen,
    ListChecks,
    FolderGit2,
    LayoutGrid,
    Monitor,
    Palette,
    Settings,
    User,
    UserCog,
    UserRound,
    type LucideIcon,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { index as indexTasks } from '@/routes/tasks';
import { show as showUserProfile } from '@/routes/user-profile';
import { edit as editAccount } from '@/routes/account';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editDisplay } from '@/routes/display';
import { edit as editNotifications } from '@/routes/notifications';
import { edit as editProfile } from '@/routes/profile';
import type { NavItem } from '@/types';

export type SidebarLink = NavItem & { id: string; icon: LucideIcon };

export type SidebarCollapsible = {
    id: string;
    title: string;
    icon: LucideIcon;
    children: SidebarLink[];
};

export type SidebarEntry = SidebarLink | SidebarCollapsible;

export type SidebarGroupDef = {
    title: string;
    items: SidebarEntry[];
};

export function isCollapsible(
    entry: SidebarEntry,
): entry is SidebarCollapsible {
    return 'children' in entry;
}

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
        ],
    },
    {
        title: 'Others',
        items: [
            {
                id: 'settings',
                title: 'Settings',
                icon: Settings,
                children: [
                    {
                        id: 'settings-profile',
                        title: 'Profile settings',
                        href: editProfile(),
                        icon: User,
                    },
                    {
                        id: 'settings-account',
                        title: 'Account',
                        href: editAccount(),
                        icon: UserCog,
                    },
                    {
                        id: 'settings-appearance',
                        title: 'Appearance',
                        href: editAppearance(),
                        icon: Palette,
                    },
                    {
                        id: 'settings-notifications',
                        title: 'Notifications',
                        href: editNotifications(),
                        icon: Bell,
                    },
                    {
                        id: 'settings-display',
                        title: 'Display',
                        href: editDisplay(),
                        icon: Monitor,
                    },
                ],
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

// Every linkable item in display order, with submenu items flattened.
// The Display settings page lists these, grouped by sidebarGroups.
export const displayGroups = sidebarGroups.map((group) => ({
    title: group.title,
    items: group.items
        .flatMap((entry) => (isCollapsible(entry) ? entry.children : [entry]))
        .map(({ id, title }) => ({ id, title })),
}));

// The groups the user chose in Display settings. Empty groups and submenus are dropped.
export function visibleSidebarGroups(
    displayItems: string[],
): SidebarGroupDef[] {
    return sidebarGroups
        .map((group): SidebarGroupDef => ({
            ...group,
            items: group.items.flatMap((entry): SidebarEntry[] => {
                if (isCollapsible(entry)) {
                    const children = entry.children.filter((child) =>
                        displayItems.includes(child.id),
                    );

                    return children.length > 0 ? [{ ...entry, children }] : [];
                }

                return displayItems.includes(entry.id) ? [entry] : [];
            }),
        }))
        .filter((group) => group.items.length > 0);
}

// Every visible link in order, with submenu items flattened into the list.
export function flattenSidebarLinks(groups: SidebarGroupDef[]): SidebarLink[] {
    return groups.flatMap((group) =>
        group.items.flatMap((entry) =>
            isCollapsible(entry) ? entry.children : [entry],
        ),
    );
}
