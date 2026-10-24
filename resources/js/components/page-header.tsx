import type { ReactNode } from 'react';

export type PageHeaderProps = {
    title: string;
    description?: string;
    actions?: ReactNode;
    meta?: ReactNode;
};

export function PageHeader({
    title,
    description,
    actions,
    meta,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                    <h1 className="truncate text-2xl font-semibold tracking-tight">
                        {title}
                    </h1>
                    {meta}
                </div>
                {description ? (
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            ) : null}
        </div>
    );
}
