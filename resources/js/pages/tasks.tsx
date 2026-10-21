import { Head, router } from '@inertiajs/react';
import { ListChecks, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { destroy, update } from '@/actions/App/Http/Controllers/TaskController';
import { DataTable } from '@/components/data-table/data-table';
import type { DataTableDetail } from '@/components/data-table/data-table-row-detail';
import PageHeader from '@/components/page-header';
import { useTaskColumns } from '@/components/tasks/columns';
import { labels, priorities, statuses } from '@/components/tasks/data';
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
import { DrawerClose } from '@/components/ui/drawer';
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

    // The drawer that opens from a task title: its fields, with an edit button.
    const renderDetail = useCallback(
        (task: Task): DataTableDetail => {
            const detailRow = (name: string, value: React.ReactNode) => (
                <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                    <dt className="text-muted-foreground">{name}</dt>
                    <dd>{value}</dd>
                </div>
            );
            const status = statuses.find((item) => item.value === task.status);
            const priority = priorities.find(
                (item) => item.value === task.priority,
            );
            const label = labels.find((item) => item.value === task.label);

            return {
                title: task.title,
                description: task.code,
                body: (
                    <dl className="flex flex-col gap-3">
                        {detailRow(t('Status'), status && t(status.label))}
                        {detailRow(
                            t('Priority'),
                            priority && t(priority.label),
                        )}
                        {detailRow(t('Label'), label && t(label.label))}
                        {task.owner && detailRow(t('Owner'), task.owner)}
                    </dl>
                ),
                // Closing the drawer and opening the dialog together avoids two modal layers.
                footer: (
                    <DrawerClose
                        render={<Button onClick={() => openDialog(task)} />}
                    >
                        {t('Edit task')}
                    </DrawerClose>
                ),
            };
        },
        [t, openDialog],
    );

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
                <PageHeader
                    title={t('Tasks')}
                    description={
                        showOwner
                            ? t('Here are the tasks of every user.')
                            : t('Here are the tasks for this month.')
                    }
                />

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
                        enableRowDragging
                        renderDetail={renderDetail}
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
