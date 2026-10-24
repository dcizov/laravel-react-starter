import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type EmptyStateProps = {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
};

/**
 * The one empty state used across every list. It always names the next step.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-14 text-center',
                className,
            )}
        >
            {Icon ? (
                <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                </div>
            ) : null}
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {description}
            </p>
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}
