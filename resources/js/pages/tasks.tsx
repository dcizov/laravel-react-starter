import { Head, router } from '@inertiajs/react';
import { ListChecks, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { destroy, update } from '@/actions/App/Http/Controllers/TaskController';
import { DataTable } from '@/components/data-table/data-table';
import { useTaskColumns } from '@/components/tasks/columns';
import type { Task } from '@/components/tasks/data';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import { TasksToolbar } from '@/components/tasks/tasks-toolbar';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { useTrans } from '@/hooks/use-trans';
import { index as tasksIndex } from '@/routes/tasks';

// The list comes from the server. Every change is sent to the Tasks controller, which flashes a toast.
export default function Tasks({ tasks }: { tasks: Task[] }) {
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

    const deleteTask = useCallback((id: number) => {
        router.delete(destroy.url(id), { preserveScroll: true });
    }, []);

    const columns = useTaskColumns({
        onEdit: (task) => openDialog(task),
        onLabelChange: changeLabel,
        onDelete: deleteTask,
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
                        {t('Here are the tasks for this month.')}
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
                        toolbar={(table) => (
                            <TasksToolbar
                                table={table}
                                onCreate={() => openDialog(null)}
                            />
                        )}
                    />
                )}
            </div>

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
