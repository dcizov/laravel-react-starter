import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    CircleCheck,
    CircleHelp,
    CircleOff,
    Circle,
    Timer,
} from 'lucide-react';

// The options a task can have. Labels are translated where they are shown.
export const labels = [
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'documentation', label: 'Documentation' },
];

export const statuses = [
    { value: 'backlog', label: 'Backlog', icon: CircleHelp },
    { value: 'todo', label: 'Todo', icon: Circle },
    { value: 'in progress', label: 'In Progress', icon: Timer },
    { value: 'done', label: 'Done', icon: CircleCheck },
    { value: 'canceled', label: 'Canceled', icon: CircleOff },
];

export const priorities = [
    { value: 'low', label: 'Low', icon: ArrowDown },
    { value: 'medium', label: 'Medium', icon: ArrowRight },
    { value: 'high', label: 'High', icon: ArrowUp },
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
