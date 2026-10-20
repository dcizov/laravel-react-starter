import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

// The brand mark: the logo an admin uploaded, or the default icon. Use it wherever the app shows its logo.
export function AppLogoMark({ className }: { className?: string }) {
    const { appLogoUrl, name } = usePage().props;

    if (appLogoUrl) {
        return (
            <img
                src={appLogoUrl}
                alt={name}
                className={cn('object-contain', className)}
            />
        );
    }

    return <AppLogoIcon className={className} />;
}

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoMark className="size-6! fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {name}
                </span>
            </div>
        </>
    );
}
