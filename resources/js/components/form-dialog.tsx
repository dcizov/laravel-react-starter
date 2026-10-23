import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function FormDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    wide = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    children: ReactNode;
    wide?: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={
                    wide
                        ? 'max-h-[92vh] overflow-y-auto rounded-2xl border-[#e3e7df] bg-[#fbfcfa] p-0 sm:max-w-2xl'
                        : 'max-h-[92vh] overflow-y-auto rounded-2xl border-[#e3e7df] bg-[#fbfcfa] p-0 sm:max-w-lg'
                }
            >
                <div className="border-b border-[#e7eae4] bg-white px-6 py-5 pr-12 sm:px-7">
                    <DialogHeader>
                        <DialogTitle className="text-xl tracking-[-0.025em] text-[#234238]">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="leading-5 text-[#7d8981]">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="px-6 py-6 sm:px-7">{children}</div>
            </DialogContent>
        </Dialog>
    );
}

export function Field({
    label,
    error,
    children,
    className = '',
}: {
    label: string;
    error?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-2 block text-xs font-semibold text-[#52665c]">
                {label}
            </span>
            {children}
            {error && (
                <span className="mt-1.5 block text-xs text-red-600">
                    {error}
                </span>
            )}
        </label>
    );
}

export const inputClass =
    'h-10 rounded-xl border-[#dfe5dc] bg-white px-3.5 text-sm text-[#314b41] shadow-none focus-visible:border-[#7e9c85] focus-visible:ring-[#7e9c85]/15';
export const selectClass =
    'h-10 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#314b41] outline-none transition focus:border-[#7e9c85] focus:ring-3 focus:ring-[#7e9c85]/15';
