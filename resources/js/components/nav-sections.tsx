import { Link } from '@inertiajs/react';
import { createElement } from 'react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { navIcon } from '@/lib/nav-icons';
import type { NavigationSection } from '@/types/navigation';

function NavIcon({ name }: { name: string | null }) {
    // createElement keeps the icon lookup out of the render tree, so eslint's
    // static-components rule stays satisfied.
    return createElement(navIcon(name));
}

export function NavSections({ sections }: { sections: NavigationSection[] }) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <>
            {sections.map((section) => (
                <SidebarGroup key={section.label} className="px-2 py-0">
                    <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-sidebar-foreground/55 uppercase">
                        {section.label}
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {section.items.map((item) => {
                            const isActive =
                                item.route === '/admin'
                                    ? isCurrentUrl(item.href)
                                    : isCurrentOrParentUrl(item.href);

                            return (
                                <SidebarMenuItem
                                    key={`${section.label}:${item.route}`}
                                >
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={{ children: item.label }}
                                    >
                                        <Link href={item.href} prefetch>
                                            <NavIcon name={item.icon} />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
