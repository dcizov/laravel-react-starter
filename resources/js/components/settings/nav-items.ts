import { Bell, Monitor, Palette, User, UserCog } from 'lucide-react';
import { edit as editAccount } from '@/routes/account';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editDisplay } from '@/routes/display';
import { edit as editNotifications } from '@/routes/notifications';
import { edit as editProfile } from '@/routes/profile';
import type { NavItem } from '@/types';

// Single source of truth for the settings sidebar (desktop links and mobile select).
// Order follows the reference app: Profile, Account, Appearance, Notifications, Display.
export const settingsNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: editProfile(),
        icon: User,
    },
    {
        title: 'Account',
        href: editAccount(),
        icon: UserCog,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
    {
        title: 'Notifications',
        href: editNotifications(),
        icon: Bell,
    },
    {
        title: 'Display',
        href: editDisplay(),
        icon: Monitor,
    },
];
