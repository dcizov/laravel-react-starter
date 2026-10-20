import { Head } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { useTaskColumns } from '@/components/tasks/columns';
import type { Task } from '@/components/tasks/data';
import { TasksToolbar } from '@/components/tasks/tasks-toolbar';
import { toast } from '@/components/ui/toast';
import { useTrans } from '@/hooks/use-trans';
import { index as tasksIndex } from '@/routes/tasks';

// Label changes and deletes only change this page's state. They are not saved to the database yet.
export default function Tasks({ tasks: initialTasks }: { tasks: Task[] }) {
    const t = useTrans();
    const [tasks, setTasks] = useState(initialTasks);

    const changeLabel = useCallback(
        (id: number, label: string) => {
            setTasks((current) =>
                current.map((task) =>
                    task.id === id ? { ...task, label } : task,
                ),
            );
            toast.add({ type: 'success', title: t('Label updated.') });
        },
        [t],
    );

    const deleteTask = useCallback(
        (id: number) => {
            const code = tasks.find((task) => task.id === id)?.code;

            setTasks((current) => current.filter((task) => task.id !== id));
            toast.add({
                type: 'success',
                title: t('Task deleted.'),
                description: code,
            });
        },
        [t, tasks],
    );

    const columns = useTaskColumns({
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
                <DataTable
                    columns={columns}
                    data={tasks}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    enableRowSelection
                    emptyMessage={t('No tasks found.')}
                    toolbar={(table) => <TasksToolbar table={table} />}
                />
            </div>
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
