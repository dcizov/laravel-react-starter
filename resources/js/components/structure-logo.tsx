import { cn } from '@/lib/utils';

export function StructureLogo({
    light = false,
    compact = false,
    className,
}: {
    light?: boolean;
    compact?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-[#dce9d7] shadow-[inset_0_0_0_1px_rgba(23,63,53,.06)]">
                <svg
                    viewBox="0 0 40 40"
                    className="size-full"
                    aria-hidden="true"
                >
                    <path
                        d="M11 27.5h7.2v-7.2h7.1V13H32"
                        fill="none"
                        stroke="#214d40"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle cx="11" cy="13" r="3" fill="#e99271" />
                    <path
                        d="M10.5 31.5h20"
                        stroke="#214d40"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity=".28"
                    />
                </svg>
            </div>
            {!compact && (
                <div className="leading-none">
                    <div
                        className={cn(
                            'text-[19px] font-semibold tracking-[-0.045em]',
                            light ? 'text-white' : 'text-[#173f35]',
                        )}
                    >
                        Structure
                        <span
                            className={
                                light ? 'text-[#cde0c5]' : 'text-[#648267]'
                            }
                        >
                            Plan
                        </span>
                    </div>
                    <div
                        className={cn(
                            'mt-1.5 text-[8px] font-semibold tracking-[0.2em]',
                            light ? 'text-white/45' : 'text-[#829087]',
                        )}
                    >
                        THERAPY WORKSPACE
                    </div>
                </div>
            )}
        </div>
    );
}
