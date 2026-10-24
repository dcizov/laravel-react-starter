import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { AdminNavSection } from '@/lib/navigation';

export function NavSections({ sections }: { sections: AdminNavSection[] }) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <>
            {sections.map((section) => (
                <SidebarGroup key={section.label} className="px-2 py-0">
                    <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-sidebar-foreground/55 uppercase">
                        {section.label}
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {section.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={
                                        item.href === '/admin'
                                            ? isCurrentUrl(item.href)
                                            : isCurrentOrParentUrl(item.href)
                                    }
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
