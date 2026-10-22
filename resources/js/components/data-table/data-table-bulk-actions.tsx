import type { RowData } from '@tanstack/react-table';
import { useState } from 'react';
import type { ComponentType } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';

// An action that runs on the rows selected in a DataTable. `onRun` gets the selected rows. Set `confirm` for an
// action that cannot be undone; the admin then confirms in a dialog before it runs.
export type DataTableBulkAction<TData extends RowData> = {
    key: string;
    label: string;
    icon?: ComponentType<{ className?: string }>;
    variant?: 'default' | 'outline' | 'destructive';
    confirm?: string | ((count: number) => string);
    // Shown when the action is not available for the current selection (for example, no permission).
    disabled?: boolean;
    onRun: (rows: TData[]) => void;
};

// The bar above a table that acts on the selected rows. It disappears when nothing is selected.
export function DataTableBulkActions<TData extends RowData>({
    selected,
    actions,
    onDone,
}: {
    selected: TData[];
    actions: DataTableBulkAction<TData>[];
    onDone: () => void;
}) {
    const t = useTrans();
    const [pending, setPending] = useState<DataTableBulkAction<TData> | null>(
        null,
    );

    if (selected.length === 0) {
        return null;
    }

    const run = (action: DataTableBulkAction<TData>) => {
        action.onRun(selected);
        onDone();
    };

    const confirmText = pending?.confirm
        ? typeof pending.confirm === 'function'
            ? pending.confirm(selected.length)
            : pending.confirm
        : '';

    return (
        <>
            <div
                role="region"
                aria-label={t('Selected rows')}
                className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2"
            >
                <span className="me-auto text-sm font-medium">
                    {t(':count selected', { count: selected.length })}
                </span>
                {actions.map((action) => {
                    const Icon = action.icon;

                    return (
                        <Button
                            key={action.key}
                            type="button"
                            size="sm"
                            variant={action.variant ?? 'outline'}
                            disabled={action.disabled}
                            onClick={() =>
                                action.confirm
                                    ? setPending(action)
                                    : run(action)
                            }
                        >
                            {Icon && <Icon />}
                            {action.label}
                        </Button>
                    );
                })}
            </div>

            <AlertDialog
                open={pending !== null}
                onOpenChange={(open) => !open && setPending(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pending?.label ?? ''}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmText}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            variant={
                                pending?.variant === 'destructive'
                                    ? 'destructive'
                                    : 'default'
                            }
                            onClick={() => {
                                if (pending) {
                                    run(pending);
                                }

                                setPending(null);
                            }}
                        >
                            {pending?.label ?? ''}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
