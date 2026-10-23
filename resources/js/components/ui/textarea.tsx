import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn('border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex min-h-24 w-full rounded-xl border bg-white px-3.5 py-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50', className)}
            {...props}
        />
    );
}

export { Textarea };
