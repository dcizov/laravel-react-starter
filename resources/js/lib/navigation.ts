import {
    Activity,
    FileText,
    Image as ImageIcon,
    LayoutDashboard,
    Palette,
    Plug,
    Settings,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminNavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

export type AdminNavSection = {
    label: string;
    items: AdminNavItem[];
};

/**
 * Static admin navigation for the first milestone.
 * From the addon milestone onwards this is replaced by the `navigation`
 * shared prop, which is built from the database-backed Navigation registry.
 */
export const adminNavigation: AdminNavSection[] = [
    {
        label: 'Workspace',
        items: [{ title: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
        label: 'Content',
        items: [
            { title: 'Pages', href: '/admin/pages', icon: FileText },
            { title: 'Media', href: '/admin/media', icon: ImageIcon },
        ],
    },
    {
        label: 'Site',
        items: [
            { title: 'Appearance', href: '/admin/appearance', icon: Palette },
            { title: 'Addons', href: '/admin/addons', icon: Plug },
        ],
    },
    {
        label: 'Team',
        items: [
            { title: 'Users', href: '/admin/users', icon: Users },
            { title: 'Activity', href: '/admin/activity', icon: Activity },
        ],
    },
    {
        label: 'System',
        items: [{ title: 'Settings', href: '/admin/settings', icon: Settings }],
    },
];
