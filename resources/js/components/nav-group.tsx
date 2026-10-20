import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { isCollapsible } from '@/components/sidebar-items';
import type {
    SidebarCollapsible,
    SidebarEntry,
    SidebarLink,
} from '@/components/sidebar-items';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useTrans } from '@/hooks/use-trans';

export function NavGroup({
    title,
    items,
}: {
    title: string;
    items: SidebarEntry[];
}) {
    const t = useTrans();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{t(title)}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((entry) =>
                    isCollapsible(entry) ? (
                        <CollapsibleNavItem
                            key={entry.id}
                            item={entry}
                            isActive={(href) => isCurrentUrl(href)}
                        />
                    ) : (
                        <SidebarMenuItem key={entry.id}>
                            <LinkButton
                                item={entry}
                                isActive={isCurrentUrl(entry.href)}
                            />
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function LinkButton({
    item,
    isActive,
}: {
    item: SidebarLink;
    isActive: boolean;
}) {
    const t = useTrans();
    const external = /^https?:\/\//.test(String(item.href));

    return (
        <SidebarMenuButton
            render={
                external ? (
                    <a
                        href={String(item.href)}
                        target="_blank"
                        rel="noopener noreferrer"
                    />
                ) : (
                    <Link href={item.href} prefetch />
                )
            }
            isActive={isActive}
            tooltip={{ children: t(item.title) }}
        >
            <item.icon />
            <span>{t(item.title)}</span>
        </SidebarMenuButton>
    );
}

function CollapsibleNavItem({
    item,
    isActive,
}: {
    item: SidebarCollapsible;
    isActive: (href: SidebarLink['href']) => boolean;
}) {
    const t = useTrans();
    // Open the submenu on load when one of its pages is the current page.
    const hasActiveChild = item.children.some((child) => isActive(child.href));

    return (
        <Collapsible defaultOpen={hasActiveChild} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger
                    render={
                        <SidebarMenuButton
                            tooltip={{ children: t(item.title) }}
                        />
                    }
                >
                    <item.icon />
                    <span>{t(item.title)}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[panel-open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.id}>
                                <SidebarMenuSubButton
                                    render={<Link href={child.href} prefetch />}
                                    isActive={isActive(child.href)}
                                >
                                    <span>{t(child.title)}</span>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
