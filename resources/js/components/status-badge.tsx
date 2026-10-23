import { cn } from '@/lib/utils';
import { titleCase } from '@/lib/format';

const styles: Record<string, string> = {
    active: 'bg-[#e6f0e6] text-[#3f684d] ring-[#c8ddca]',
    scheduled: 'bg-[#e8eef4] text-[#4b667c] ring-[#d3dee8]',
    completed: 'bg-[#e9f1e8] text-[#4b6d50] ring-[#d2e0cf]',
    draft: 'bg-[#f1efe7] text-[#776d4c] ring-[#e0dcc9]',
    waitlist: 'bg-[#f5ecdf] text-[#8b6741] ring-[#e9dac5]',
    cancelled: 'bg-[#f3ecec] text-[#8b6262] ring-[#e7d6d6]',
    discharged: 'bg-[#efefed] text-[#6f746f] ring-[#dedfdb]',
    low: 'bg-[#edf2ea] text-[#58705a] ring-[#dae4d5]',
    moderate: 'bg-[#f7edda] text-[#8c672e] ring-[#ead8b7]',
    high: 'bg-[#f6e4e1] text-[#9a514a] ring-[#eacbc6]',
};

export function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
                styles[status] ?? styles.draft,
                className,
            )}
        >
            <span className="size-1.5 rounded-full bg-current opacity-60" />
            {titleCase(status)}
        </span>
    );
}
