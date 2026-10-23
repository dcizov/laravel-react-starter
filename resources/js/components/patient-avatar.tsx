import { cn } from '@/lib/utils';

const palettes = [
    'bg-[#e4ede1] text-[#385b47]',
    'bg-[#f2e6db] text-[#8a5c3d]',
    'bg-[#e6e8f1] text-[#525c80]',
    'bg-[#efe4e8] text-[#86586c]',
    'bg-[#e1eceb] text-[#3c6a67]',
    'bg-[#ede9dc] text-[#74683e]',
];

export function PatientAvatar({
    initials,
    id = 0,
    className,
}: {
    initials: string;
    id?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide',
                palettes[id % palettes.length],
                className,
            )}
            aria-hidden="true"
        >
            {initials}
        </div>
    );
}
