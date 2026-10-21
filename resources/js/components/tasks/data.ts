import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    CircleCheck,
    CircleHelp,
    CircleOff,
    Circle,
    LoaderCircle,
} from 'lucide-react';

// The options a task can have. Labels are translated where they are shown.
export const labels = [
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'documentation', label: 'Documentation' },
];

export const statuses = [
    // Icon colours follow the dashboard-01 status badges: the text stays muted, only the icon is coloured.
    {
        value: 'backlog',
        label: 'Backlog',
        icon: CircleHelp,
        iconClass: 'text-muted-foreground',
    },
    {
        value: 'todo',
        label: 'Todo',
        icon: Circle,
        iconClass: 'text-muted-foreground',
    },
    {
        value: 'in progress',
        label: 'In Progress',
        icon: LoaderCircle,
        iconClass: 'text-blue-500',
    },
    {
        value: 'done',
        label: 'Done',
        icon: CircleCheck,
        iconClass: 'text-emerald-500',
    },
    {
        value: 'canceled',
        label: 'Canceled',
        icon: CircleOff,
        iconClass: 'text-rose-500',
    },
];

export const priorities = [
    {
        value: 'low',
        label: 'Low',
        icon: ArrowDown,
        iconClass: 'text-muted-foreground',
    },
    {
        value: 'medium',
        label: 'Medium',
        icon: ArrowRight,
        iconClass: 'text-amber-500',
    },
    { value: 'high', label: 'High', icon: ArrowUp, iconClass: 'text-rose-500' },
];

export type Task = {
    id: number;
    code: string;
    title: string;
    status: string;
    label: string;
    priority: string;
    // Only sent to users who can view every task.
    owner?: string | null;
};
