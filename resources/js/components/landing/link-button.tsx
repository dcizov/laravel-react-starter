import { Button } from '@/components/ui/button';

// External links open in a new tab. Paths on this site stay in the tab.
export function LinkButton({
    href,
    label,
    variant = 'outline',
}: {
    href: string;
    label: string;
    variant?: 'outline' | 'default';
}) {
    const external = /^https?:\/\//i.test(href);

    return (
        <Button
            variant={variant}
            nativeButton={false}
            render={
                <a
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer' : undefined}
                />
            }
        >
            {label}
        </Button>
    );
}
