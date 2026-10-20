import { Link, usePage } from '@inertiajs/react';
import { Fragment } from 'react';
import AppLogo from '@/components/app-logo';
import { NavGroup } from '@/components/nav-group';
import { NavUser } from '@/components/nav-user';
import { visibleSidebarGroups } from '@/components/sidebar-items';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';

export function AppSidebar() {
    // Users choose which items show here in Display settings.
    const { displayItems, sidebarVariant, auth } = usePage().props;

    const visibleGroups = visibleSidebarGroups(displayItems, auth.permissions);

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
                {visibleGroups.map((group, index) => (
                    <Fragment key={group.title}>
                        {/* Groups have no labels in icon mode, so a divider separates them. */}
                        {index > 0 && (
                            <SidebarSeparator className="hidden group-data-[collapsible=icon]:block" />
                        )}
                        <NavGroup title={group.title} items={group.items} />
                    </Fragment>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
