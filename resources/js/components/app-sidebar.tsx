import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { NavGroup } from '@/components/nav-group';
import { NavUser } from '@/components/nav-user';
import { visibleSidebarGroups } from '@/components/sidebar-items';
import { SiteSwitcher } from '@/components/site-switcher';
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
    const { displayItems, sidebarVariant, auth, features } = usePage().props;

    const visibleGroups = visibleSidebarGroups(
        displayItems,
        auth.permissions,
        features,
    );

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
                <SiteSwitcher />
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
