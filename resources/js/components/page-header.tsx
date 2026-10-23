import type { ReactNode } from 'react';

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow?: string;
    title: string;
    description: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                {eyebrow && (
                    <div className="mb-2 text-[11px] font-semibold tracking-[0.15em] text-[#829087] uppercase">
                        {eyebrow}
                    </div>
                )}
                <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.04em] text-[#203d34] sm:text-[34px]">
                    {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748079]">
                    {description}
                </p>
            </div>
            {actions && (
                <div className="flex shrink-0 items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
