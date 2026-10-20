import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { NavGroup } from '@/components/nav-group';
import { NavUser } from '@/components/nav-user';
import {
    isCollapsible,
    sidebarGroups,
    type SidebarEntry,
    type SidebarGroupDef,
} from '@/components/sidebar-items';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';

export function AppSidebar() {
    // Users choose which items show here in Display settings.
    const { displayItems, sidebarVariant } = usePage().props;

    const visibleGroups = sidebarGroups
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

    return (
        <Sidebar
            collapsible="icon"
            variant={sidebarVariant === 'floating' ? 'floating' : 'sidebar'}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={<Link href={dashboard()} prefetch />}
                        >
                            <AppLogo />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {visibleGroups.map((group) => (
                    <NavGroup
                        key={group.title}
                        title={group.title}
                        items={group.items}
                    />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
