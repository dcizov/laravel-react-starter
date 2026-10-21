import { use } from 'react';
import {
    EditableText,
    LandingEditContext,
} from '@/components/landing/landing-edit';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'outline' | 'secondary';
type ButtonSize = 'default' | 'lg';

// External links open in a new tab. Paths on this site stay in the tab.
// In the visual editor the button is drawn as a span with an editable label, so clicking it never navigates.
// labelPath is the data path of the label, for example "button_label" or "items.0.button_label".
export function LinkButton({
    href,
    label,
    labelPath,
    variant = 'outline',
    size = 'default',
    className,
}: {
    href: string;
    label: string;
    labelPath?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
}) {
    const edit = use(LandingEditContext);

    if (edit && labelPath) {
        return (
            <span className={cn(buttonVariants({ variant, size }), className)}>
                <EditableText
                    as="span"
                    path={labelPath}
                    value={label}
                    required
                    max={40}
                />
            </span>
        );
    }

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
