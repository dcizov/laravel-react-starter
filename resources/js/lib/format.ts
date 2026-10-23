export function formatDate(
    date: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    },
): string {
    if (!date) return 'Not set';
    const value = date.length === 10 ? `${date}T12:00:00` : date;
    return new Intl.DateTimeFormat('en-US', options).format(new Date(value));
}

export function formatTime(date: string): string {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

export function toDateTimeLocal(date: string | null): string {
    if (!date) return '';
    const value = new Date(date);
    const offset = value.getTimezoneOffset() * 60_000;
    return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export function titleCase(value: string): string {
    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function relativeDate(date: string | null): string {
    if (!date) return 'No check-ins yet';
    const day = new Date(`${date.slice(0, 10)}T12:00:00`);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return formatDate(date, { month: 'short', day: 'numeric' });
}
