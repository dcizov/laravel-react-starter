import { Link } from '@inertiajs/react';
import type { SidebarEntry, SidebarLink } from '@/components/sidebar-items';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
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
    const { state, isMobile } = useSidebar();
    // The icon rail has no room for headings, so they are left out there.
    const iconRail = state === 'collapsed' && !isMobile;

    return (
        <SidebarGroup>
            {!iconRail && <SidebarGroupLabel>{t(title)}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((entry) => (
                    <SidebarMenuItem key={entry.id}>
                        <LinkButton
                            item={entry}
                            // Prefix match, so Settings stays active on its subpages.
                            isActive={isCurrentUrl(entry.href, undefined, true)}
                        />
                    </SidebarMenuItem>
                ))}
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
