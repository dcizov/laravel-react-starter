import { Link } from '@inertiajs/react';
import { ExternalLink, Search } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavSections } from '@/components/nav-sections';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
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
import { adminNavigation } from '@/lib/navigation';

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 font-normal text-muted-foreground"
                        disabled
                        title="Search arrives with the command palette"
                    >
                        <Search className="size-3.5" />
                        <span>Search…</span>
                        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            ⌘K
                        </kbd>
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavSections sections={adminNavigation} />
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip={{ children: 'View site' }}
                        >
                            <a href="/" target="_blank" rel="noreferrer">
                                <ExternalLink />
                                <span>View site</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarSeparator />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
