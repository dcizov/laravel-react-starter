import { router, usePage } from '@inertiajs/react';
import { ShortcutHint } from '@/components/shortcut-hint';
import {
    flattenSidebarLinks,
    visibleSidebarGroups,
    type SidebarLink,
} from '@/components/sidebar-items';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { useTrans } from '@/hooks/use-trans';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onToggleTheme: () => void;
};

// The address of a link, whether Wayfinder gave us a string or a { url, method } object.
function hrefOf(link: SidebarLink): string {
    const href = link.href;

    return typeof href === 'string' ? href : String(href.url);
}

// Search over the visible pages and a few actions. Opened from the top bar.
export function CommandSearch({ open, onOpenChange, onToggleTheme }: Props) {
    const t = useTrans();
    const { displayItems } = usePage().props;
    const groups = visibleSidebarGroups(displayItems);

    const run = (action: () => void) => {
        onOpenChange(false);
        action();
    };

    const openLink = (link: SidebarLink) => {
        const url = hrefOf(link);

        if (/^https?:\/\//.test(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');

            return;
        }

        router.get(url);
    };

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t('Search')}
            description={t('Search for a page or action to run.')}
        >
            <CommandInput placeholder={t('Search pages and actions...')} />
            <CommandList>
                <CommandEmpty>{t('No results found.')}</CommandEmpty>

                {groups.map((group) => (
                    <CommandGroup key={group.title} heading={t(group.title)}>
                        {flattenSidebarLinks([group]).map((link) => (
                            <CommandItem
                                key={link.id}
                                value={`${t(link.title)} ${link.id}`}
                                onSelect={() => run(() => openLink(link))}
                            >
                                <link.icon />
                                {t(link.title)}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}

                {groups.length > 0 && <CommandSeparator />}

                <CommandGroup heading={t('Actions')}>
                    <CommandItem
                        value={`${t('Toggle theme')} theme`}
                        onSelect={() => run(onToggleTheme)}
                    >
                        {t('Toggle theme')}
                        <ShortcutHint id="theme" />
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
