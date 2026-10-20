import { CircleCheckIcon } from 'lucide-react';
import type * as React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// A success message after an action, such as a sent link or a saved change.
export function StatusAlert({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Alert className={className}>
            <CircleCheckIcon aria-hidden="true" />
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    );
}
