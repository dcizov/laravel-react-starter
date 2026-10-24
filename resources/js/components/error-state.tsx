import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ErrorStateProps = {
    title?: string;
    message: string;
    onRetry?: () => void;
    className?: string;
};

/**
 * Inline error panel with an explicit retry. Never a blank screen.
 */
export function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            role="alert"
            className={cn(
                'flex flex-col gap-3 rounded-lg border border-status-error/30 bg-status-error-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-status-error" />
                <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </div>
            {onRetry ? (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    <RotateCcw className="size-3.5" />
                    Retry
                </Button>
            ) : null}
        </div>
    );
}
