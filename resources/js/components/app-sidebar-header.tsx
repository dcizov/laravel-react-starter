import { Moon, Sun } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { useTrans } from '@/hooks/use-trans';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

// Top bar above the page content: sidebar toggle, breadcrumbs, and quick actions.
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const t = useTrans();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <Separator
                orientation="vertical"
                className="mr-1 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs breadcrumbs={breadcrumbs} />

            <div className="ml-auto flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('Toggle theme')}
                    title={t('Toggle theme')}
                    onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                >
                    {isDark ? <Sun /> : <Moon />}
                </Button>
            </div>
        </header>
    );
}
