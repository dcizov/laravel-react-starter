import {
    Activity,
    BookOpen,
    FileText,
    FlaskConical,
    Image as ImageIcon,
    LayoutDashboard,
    LayoutGrid,
    Mail,
    Newspaper,
    Palette,
    Plug,
    Settings,
    Shield,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = {
    activity: Activity,
    'book-open': BookOpen,
    'file-text': FileText,
    'flask-conical': FlaskConical,
    image: ImageIcon,
    'layout-dashboard': LayoutDashboard,
    'layout-grid': LayoutGrid,
    mail: Mail,
    newspaper: Newspaper,
    palette: Palette,
    plug: Plug,
    settings: Settings,
    shield: Shield,
    users: Users,
};

/**
 * Manifests reference icons by name so they can stay declarative. Unknown
 * names fall back to a neutral icon instead of breaking the sidebar.
 */
export function navIcon(name: string | null): LucideIcon {
    if (name === null) {
        return LayoutGrid;
    }

    return icons[name] ?? LayoutGrid;
}
