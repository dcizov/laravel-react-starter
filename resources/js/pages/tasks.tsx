import { Head, router } from '@inertiajs/react';
import { ListChecks, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { destroy, update } from '@/actions/App/Http/Controllers/TaskController';
import { DataTable } from '@/components/data-table/data-table';
import { useTaskColumns } from '@/components/tasks/columns';
import { priorities, statuses } from '@/components/tasks/data';
import type { Task } from '@/components/tasks/data';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
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
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { index as tasksIndex } from '@/routes/tasks';

// The list comes from the server. Every change is sent to the Tasks controller, which flashes a toast.
export default function Tasks({
    tasks,
    showOwner,
}: {
    tasks: Task[];
    showOwner: boolean;
}) {
    const t = useTrans();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Task | null>(null);
    // Changing this key gives the dialog a fresh form each time it opens.
    const [formKey, setFormKey] = useState(0);

    const openDialog = useCallback((task: Task | null) => {
        setEditing(task);
        setFormKey((key) => key + 1);
        setDialogOpen(true);
    }, []);

    const changeLabel = useCallback((id: number, label: string) => {
        router.patch(update.url(id), { label }, { preserveScroll: true });
    }, []);

    // Deleting asks first. The task is only removed when the user confirms below.
    const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
    const [deleting, setDeleting] = useState(false);

    const askToDelete = useCallback(
        (id: number) => {
            setPendingDelete(tasks.find((task) => task.id === id) ?? null);
        },
        [tasks],
    );

    const confirmDelete = () => {
        if (!pendingDelete) {
            return;
        }

        router.delete(destroy.url(pendingDelete.id), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => setDeleting(false),
            onSuccess: () => setPendingDelete(null),
        });
    };

    const columns = useTaskColumns({
        onEdit: (task) => openDialog(task),
        onLabelChange: changeLabel,
        onDelete: askToDelete,
        showOwner,
    });

    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    return (
        <>
            <Head title={t('Tasks')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('Tasks')}
                    </h1>
                    <p className="text-muted-foreground">
                        {showOwner
                            ? t('Here are the tasks of every user.')
                            : t('Here are the tasks for this month.')}
                    </p>
                </div>

                {tasks.length === 0 ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <ListChecks />
                            </EmptyMedia>
                            <EmptyTitle>{t('No tasks yet')}</EmptyTitle>
                            <EmptyDescription>
                                {t(
                                    'Create your first task to start your list.',
                                )}
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button onClick={() => openDialog(null)}>
                                <Plus />
                                {t('Create task')}
                            </Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <DataTable
                        columns={columns}
                        data={tasks}
                        getRowId={(row) => String(row.id)}
                        pageSizes={pageSizes}
                        enableRowSelection
                        toolbar={{
                            search: {
                                column: 'title',
                                placeholder: t('Filter tasks...'),
                            },
                            filters: [
                                {
                                    column: 'status',
                                    title: t('Status'),
                                    options: statuses.map((status) => ({
                                        ...status,
                                        label: t(status.label),
                                    })),
                                },
                                {
                                    column: 'priority',
                                    title: t('Priority'),
                                    options: priorities.map((priority) => ({
                                        ...priority,
                                        label: t(priority.label),
                                    })),
                                },
                            ],
                            actions: () => (
                                <Button
                                    size="sm"
                                    className="h-8"
                                    onClick={() => openDialog(null)}
                                >
                                    <Plus />
                                    {t('Create task')}
                                </Button>
                            ),
                        }}
                    />
                )}
            </div>

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) {
                        setPendingDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Delete task?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                ':title will be permanently deleted. This cannot be undone.',
                                { title: pendingDelete?.title ?? '' },
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            {t('Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deleting}
                            onClick={(event) => {
                                event.preventDefault();
                                confirmDelete();
                            }}
                        >
                            {deleting && <Spinner />}
                            {t('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TaskFormDialog
                key={formKey}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                task={editing}
            />
        </>
    );
}

Tasks.layout = {
    breadcrumbs: [
        {
            title: 'Tasks',
            href: tasksIndex(),
        },
    ],
};
