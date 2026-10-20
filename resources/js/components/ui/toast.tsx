'use client';

import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import {
    CircleCheck,
    Info,
    LoaderCircle,
    OctagonX,
    TriangleAlert,
    X,
} from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// Adapted from the shadcn Base UI toast (base-nova style) to this app's icons and Button.
const toast = ToastPrimitive.createToastManager();

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
    return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
    return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
    return (
        <ToastPrimitive.Viewport
            data-slot="toast-viewport"
            className={cn(
                'pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full',
                className,
            )}
            {...props}
        />
    );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
    return (
        <ToastPrimitive.Root
            data-slot="toast"
            className={cn(
                'cn-toast group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-xl border bg-popover text-popover-foreground shadow-lg will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                '[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]',
                'h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]',
                "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
                'data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
                'data-limited:opacity-0 data-starting-style:[transform:translateY(150%)]',
                '[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]',
                'data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
                'data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
                'data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
                'data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
                'data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
                'data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
                'data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
                'data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
                className,
            )}
            {...props}
        />
    );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
    return (
        <ToastPrimitive.Content
            data-slot="toast-content"
            className={cn(
                'flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100',
                className,
            )}
            {...props}
        />
    );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
    return (
        <ToastPrimitive.Title
            data-slot="toast-title"
            className={cn('text-sm font-medium', className)}
            {...props}
        />
    );
}

function ToastDescription({
    className,
    ...props
}: ToastPrimitive.Description.Props) {
    return (
        <ToastPrimitive.Description
            data-slot="toast-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

function ToastAction({
    className,
    render = <Button variant="outline" size="sm" />,
    ...props
}: ToastPrimitive.Action.Props) {
    return (
        <ToastPrimitive.Action
            data-slot="toast-action"
            render={render}
            className={cn('shrink-0', className)}
            {...props}
        />
    );
}

function ToastClose({
    className,
    children,
    render = <Button variant="ghost" size="icon" className="size-7" />,
    ...props
}: ToastPrimitive.Close.Props) {
    const t = useTrans();

    return (
        <ToastPrimitive.Close
            data-slot="toast-close"
            aria-label={t('Close notification')}
            render={render}
            className={cn(
                "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
                className,
            )}
            {...props}
        >
            {children ?? <X aria-hidden="true" />}
        </ToastPrimitive.Close>
    );
}

// The status icon for each toast type, shown in a tile tinted to match. Toasts without a type show no icon.
const toastIconTones: Record<string, { className: string; icon: React.ReactNode }> = {
    success: {
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        icon: <CircleCheck aria-hidden="true" />,
    },
    info: {
        className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        icon: <Info aria-hidden="true" />,
    },
    warning: {
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        icon: <TriangleAlert aria-hidden="true" />,
    },
    error: {
        className: 'bg-destructive/10 text-destructive',
        icon: <OctagonX aria-hidden="true" />,
    },
    loading: {
        className: 'bg-muted text-muted-foreground',
        icon: <LoaderCircle aria-hidden="true" className="animate-spin" />,
    },
};

function ToastIcon({ type }: { type: string | undefined }) {
    const tone = type ? toastIconTones[type] : undefined;

    if (!tone) {
        return null;
    }

    return (
        <span
            data-slot="toast-icon"
            className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4',
                tone.className,
            )}
        >
            {tone.icon}
        </span>
    );
}

function ToastList() {
    const { toasts } = ToastPrimitive.useToastManager();

    return toasts.map((toastItem) => (
        <Toast key={toastItem.id} toast={toastItem}>
            <ToastContent>
                <ToastIcon type={toastItem.type} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <ToastTitle />
                    <ToastDescription />
                </div>
                {toastItem.actionProps && (
                    <ToastAction {...toastItem.actionProps} />
                )}
                <ToastClose />
            </ToastContent>
        </Toast>
    ));
}

function Toaster({
    children,
    toastManager = toast,
    ...props
}: ToastPrimitive.Provider.Props) {
    return (
        <ToastProvider toastManager={toastManager} {...props}>
            {children}
            <ToastPortal>
                <ToastViewport>
                    <ToastList />
                </ToastViewport>
            </ToastPortal>
        </ToastProvider>
    );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
    Toaster,
    Toast,
    ToastAction,
    ToastClose,
    ToastContent,
    ToastDescription,
    ToastPortal,
    ToastProvider,
    ToastTitle,
    ToastViewport,
    createToastManager,
    toast,
    useToastManager,
};
