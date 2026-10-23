import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#edf2e9] text-[#668069]">
                <Icon className="size-5" strokeWidth={1.7} />
            </div>
            <h3 className="font-semibold text-[#2b473d]">{title}</h3>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-[#829087]">
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
