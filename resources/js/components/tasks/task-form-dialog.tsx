import { useForm } from '@inertiajs/react';
import { store, update } from '@/actions/App/Http/Controllers/TaskController';
import InputError from '@/components/input-error';
import {
    labels,
    priorities,
    statuses,
    type Task,
} from '@/components/tasks/data';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';

type TaskFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // The task to edit, or null to create one.
    task: Task | null;
};

// Creates a task, or edits one the user owns. Saving goes through the Tasks controller.
export function TaskFormDialog({
    open,
    onOpenChange,
    task,
}: TaskFormDialogProps) {
    const t = useTrans();
    const form = useForm({
        title: task?.title ?? '',
        status: task?.status ?? 'todo',
        label: task?.label ?? 'bug',
        priority: task?.priority ?? 'medium',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (task) {
            form.patch(update.url(task.id), options);
        } else {
            form.post(store.url(), options);
        }
    };

    const title = task ? t('Edit task') : t('Create task');

    // The translated label of a select option, shown in the trigger.
    const optionLabel = (
        options: { value: string; label: string }[],
        value: string,
    ) => {
        const option = options.find((item) => item.value === value);

        return option ? t(option.label) : null;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {task
                        ? t('Change the title or the options of this task.')
                        : t('Add a task to your list.')}
                </DialogDescription>

                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="task-title">{t('Title')}</Label>
                        <Input
                            id="task-title"
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                            autoFocus
                        />
                        <InputError message={form.errors.title} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="task-status">{t('Status')}</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(value) =>
                                    form.setData('status', value ?? 'todo')
                                }
                            >
                                <SelectTrigger
                                    id="task-status"
                                    className="w-full"
                                >
                                    <SelectValue>
                                        {(value: string) =>
                                            optionLabel(statuses, value)
                                        }
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {t(item.label)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.status} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="task-priority">
                                {t('Priority')}
                            </Label>
                            <Select
                                value={form.data.priority}
                                onValueChange={(value) =>
                                    form.setData('priority', value ?? 'medium')
                                }
                            >
                                <SelectTrigger
                                    id="task-priority"
                                    className="w-full"
                                >
                                    <SelectValue>
                                        {(value: string) =>
                                            optionLabel(priorities, value)
                                        }
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {priorities.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {t(item.label)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.priority} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="task-label">{t('Label')}</Label>
                        <Select
                            value={form.data.label}
                            onValueChange={(value) =>
                                form.setData('label', value ?? 'bug')
                            }
                        >
                            <SelectTrigger id="task-label" className="w-full">
                                <SelectValue>
                                    {(value: string) =>
                                        optionLabel(labels, value)
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {labels.map((item) => (
                                    <SelectItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {t(item.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.label} />
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose
                            render={
                                <Button type="button" variant="secondary" />
                            }
                        >
                            {t('Cancel')}
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {task ? t('Save changes') : t('Create task')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
