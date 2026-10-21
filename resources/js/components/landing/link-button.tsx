import { Button } from '@/components/ui/button';

// External links open in a new tab. Paths on this site stay in the tab.
export function LinkButton({
    href,
    label,
    variant = 'outline',
    size = 'default',
    className,
}: {
    href: string;
    label: string;
    variant?: 'default' | 'outline' | 'secondary';
    size?: 'default' | 'lg';
    className?: string;
}) {
    const external = /^https?:\/\//i.test(href);

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
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
