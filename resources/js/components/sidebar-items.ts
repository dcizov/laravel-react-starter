import {
    Bell,
    BookOpen,
    FolderGit2,
    LayoutGrid,
    Palette,
    User,
    UserCog,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { edit as editAccount } from '@/routes/account';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editNotifications } from '@/routes/notifications';
import { edit as editProfile } from '@/routes/profile';
import type { NavItem } from '@/types';

export type SidebarItem = NavItem & { id: string };

// The ids must match App\Support\DisplaySettings::ITEMS on the server.
// The Display settings page and the sidebar both read from this list.
export const mainSidebarItems: SidebarItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    { id: 'profile', title: 'Profile', href: editProfile(), icon: User },
    { id: 'account', title: 'Account', href: editAccount(), icon: UserCog },
    {
        id: 'appearance',
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
    {
        id: 'notifications',
        title: 'Notifications',
        href: editNotifications(),
        icon: Bell,
    },
];

export const footerSidebarItems: SidebarItem[] = [
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
];

export const displayOptions = [...mainSidebarItems, ...footerSidebarItems].map(
    ({ id, title }) => ({ id, title }),
);
