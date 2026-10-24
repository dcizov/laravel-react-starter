import type { CSSProperties, ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type RevealProps = {
    children: ReactNode;
    /**
     * Position inside a group. Each step adds 40ms of delay so a grid arrives
     * in reading order instead of all at once.
     */
    index?: number;
    as?: ElementType;
    className?: string;
};

/**
 * Entrance animation for page sections.
 *
 * Deliberately CSS-only: the server and the client both render the same class
 * and the same custom property, so hydration cannot disagree, and
 * `prefers-reduced-motion` is handled by the stylesheet before paint instead of
 * by a JavaScript media query that would only run after hydration.
 *
 * @see resources/css/app.css — `@utility reveal`
 */
export function Reveal({
    children,
    index = 0,
    as: Component = 'div',
    className,
}: RevealProps) {
    const delay = `${Math.min(index, 6) * 40}ms`;

    return (
        <Component
            className={cn('reveal', className)}
            style={{ '--reveal-delay': delay } as CSSProperties}
        >
            {children}
        </Component>
    );
}
