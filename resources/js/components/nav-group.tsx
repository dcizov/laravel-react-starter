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

// A link's href is either a URL string or a route object with a url, as Inertia and Wayfinder provide.
function hrefUrl(href: SidebarLink['href']): string {
    return typeof href === 'string' ? href : href.url;
}

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
            <SidebarMenu className={iconRail ? undefined : 'gap-1'}>
                {items.map((entry) => (
                    <SidebarMenuItem key={entry.id}>
                        <LinkButton
                            item={entry}
                            // Prefix match, so Settings stays active on its subpages.
                            isActive={isCurrentUrl(entry.href, undefined, true)}
                            // Rows are 36px in the expanded sidebar, as the reference shows.
                            className={iconRail ? undefined : 'h-9'}
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
    className,
}: {
    item: SidebarLink;
    isActive: boolean;
    className?: string;
}) {
    const t = useTrans();
    const url = hrefUrl(item.href);
    const external = /^https?:\/\//.test(url);

    return (
        <SidebarMenuButton
            render={
                external ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" />
                ) : (
                    <Link href={item.href} prefetch />
                )
            }
            isActive={isActive}
            className={className}
            tooltip={{ children: t(item.title) }}
        >
            <item.icon />
            <span>{t(item.title)}</span>
        </SidebarMenuButton>
    );
}
