import { Link } from '@inertiajs/react';
import type { SidebarEntry, SidebarLink } from '@/components/sidebar-items';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useTrans } from '@/hooks/use-trans';

// Expanded sidebar: the items are sub-menu rows under the group heading, as in the
// shadcn sidebar-03 block. The icon rail keeps one icon button per item instead.
export function NavGroup({
    title,
    items,
}: {
    title: string;
    items: SidebarEntry[];
}) {
    const t = useTrans();
    const { isCurrentUrl } = useCurrentUrl();
    const { state, isMobile } = useSidebar();
    // The icon rail has no room for headings, so they are left out there.
    const iconRail = state === 'collapsed' && !isMobile;

    if (iconRail) {
        return (
            <SidebarGroup>
                <SidebarMenu>
                    {items.map((entry) => (
                        <SidebarMenuItem key={entry.id}>
                            <LinkButton
                                item={entry}
                                // Prefix match, so Settings stays active on its subpages.
                                isActive={isCurrentUrl(
                                    entry.href,
                                    undefined,
                                    true,
                                )}
                            />
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{t(title)}</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuSub>
                        {items.map((entry) => (
                            <SidebarMenuSubItem key={entry.id}>
                                <SubLinkButton
                                    item={entry}
                                    isActive={isCurrentUrl(
                                        entry.href,
                                        undefined,
                                        true,
                                    )}
                                />
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </SidebarMenuItem>
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

function SubLinkButton({
    item,
    isActive,
}: {
    item: SidebarLink;
    isActive: boolean;
}) {
    const t = useTrans();
    const external = /^https?:\/\//.test(String(item.href));

    return (
        <SidebarMenuSubButton
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
        >
            <item.icon />
            <span>{t(item.title)}</span>
        </SidebarMenuSubButton>
    );
}
