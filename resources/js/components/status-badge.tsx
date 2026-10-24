import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'error';

const statusStyles: Record<ContentStatus, string> = {
    draft: 'bg-status-draft-soft text-status-draft border-status-draft/25',
    scheduled:
        'bg-status-scheduled-soft text-status-scheduled border-status-scheduled/30',
    published:
        'bg-status-published-soft text-status-published border-status-published/30',
    error: 'bg-status-error-soft text-status-error border-status-error/30',
};

const statusLabels: Record<ContentStatus, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    published: 'Published',
    error: 'Error',
};

export function StatusBadge({
    status,
    className,
}: {
    status: ContentStatus;
    className?: string;
}) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1.5 font-medium',
                statusStyles[status],
                className,
            )}
        >
            <span
                className="size-1.5 rounded-full bg-current"
                aria-hidden="true"
            />
            {statusLabels[status]}
        </Badge>
    );
}
