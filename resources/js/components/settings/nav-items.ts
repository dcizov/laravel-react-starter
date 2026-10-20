import { Palette, ShieldCheck, SlidersHorizontal, User } from 'lucide-react';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editGeneral } from '@/routes/general';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

// Single source of truth for the settings sidebar (desktop links and mobile select).
export const settingsNavItems: NavItem[] = [
    {
        title: 'General',
        href: editGeneral(),
        icon: SlidersHorizontal,
    },
    {
        title: 'Profile',
        href: editProfile(),
        icon: User,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
];
