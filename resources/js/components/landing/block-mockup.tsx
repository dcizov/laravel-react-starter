import type { BlockType } from '@/components/landing/block-types';
import { cn } from '@/lib/utils';

// Grey wireframe thumbnails for the block palette. Drawn with the current text colour at low opacity,
// so they follow the light and dark themes. They show the shape of each block, not its content.

function Bar({ className }: { className?: string }) {
    return (
        <div className={cn('h-1.5 rounded-full bg-foreground/25', className)} />
    );
}

function Pill({ className }: { className?: string }) {
    return (
        <div className={cn('h-2.5 rounded-sm bg-foreground/60', className)} />
    );
}

function Box({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                'flex flex-col justify-center gap-1 rounded-sm border border-foreground/15 bg-background p-1.5',
                className,
            )}
        >
            {children}
        </div>
    );
}

function Filled({ className }: { className?: string }) {
    return <div className={cn('rounded-sm bg-foreground/10', className)} />;
}

function Repeat({
    count,
    render,
}: {
    count: number;
    render: (index: number) => React.ReactNode;
}) {
    return <>{Array.from({ length: count }, (_, index) => render(index))}</>;
}

function Skeleton({ type, variant }: { type: BlockType; variant: number }) {
    switch (type) {
        case 'navbar':
            if (variant === 1) {
                return (
                    <div className="flex items-center justify-between rounded-full border border-foreground/15 bg-background px-2 py-1.5">
                        <Bar className="w-5" />
                        <div className="flex gap-1.5">
                            <Bar className="w-4" />
                            <Bar className="w-4" />
                        </div>
                        <Pill className="w-6" />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="flex items-center justify-between border-b border-foreground/15 pb-1.5">
                        <Bar className="w-6" />
                        <Pill className="w-6" />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="flex flex-col gap-1.5 border-b border-foreground/15 pb-1.5">
                        <div className="flex justify-end gap-1.5">
                            <Bar className="w-4" />
                            <Bar className="w-4" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Bar className="w-6" />
                            <Pill className="w-6" />
                        </div>
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="flex items-center justify-between border-b border-foreground/15 pb-1.5">
                        <div className="flex gap-1.5">
                            <Bar className="w-4" />
                            <Bar className="w-4" />
                        </div>
                        <Bar className="w-6" />
                        <Pill className="w-5" />
                    </div>
                );
            }
            return (
                <div className="flex items-center justify-between border-b border-foreground/15 pb-1.5">
                    <Bar className="w-6" />
                    <div className="flex gap-1.5">
                        <Bar className="w-4" />
                        <Bar className="w-4" />
                        <Bar className="w-4" />
                    </div>
                    <Pill className="w-6" />
                </div>
            );

        case 'footer':
            if (variant === 1) {
                return (
                    <div className="flex flex-col gap-1.5 border-t border-foreground/15 pt-2">
                        <Bar className="w-8" />
                        <Bar className="w-14" />
                        <Bar className="w-10" />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="flex items-center justify-between border-t border-foreground/15 pt-2">
                        <Bar className="w-8" />
                        <div className="flex gap-1.5">
                            <Bar className="w-4" />
                            <Bar className="w-4" />
                        </div>
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="flex flex-col gap-2 border-t border-foreground/15 pt-2">
                        <Pill className="h-3 w-12" />
                        <div className="flex gap-2">
                            <Bar className="w-5" />
                            <Bar className="w-5" />
                            <Bar className="w-5" />
                        </div>
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="flex flex-col items-center gap-1.5 border-t border-foreground/15 pt-2">
                        <Bar className="w-6" />
                        <div className="flex gap-1.5">
                            <Bar className="w-4" />
                            <Bar className="w-4" />
                            <Bar className="w-4" />
                        </div>
                    </div>
                );
            }
            return (
                <div className="grid grid-cols-4 gap-1.5 border-t border-foreground/15 pt-2">
                    <Repeat
                        count={4}
                        render={(index) => (
                            <div key={index} className="flex flex-col gap-1">
                                <Bar className="w-full" />
                                <Bar className="w-3/4" />
                                <Bar className="w-1/2" />
                            </div>
                        )}
                    />
                </div>
            );

        case 'hero':
            if (variant === 1) {
                return (
                    <div className="grid h-full grid-cols-2 items-center gap-2">
                        <div className="flex flex-col gap-1.5">
                            <Bar className="w-full" />
                            <Bar className="w-3/4" />
                            <Bar className="w-1/2" />
                            <Pill className="mt-1 w-10" />
                        </div>
                        <Filled className="h-full min-h-10" />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="flex h-full flex-col justify-center gap-1.5">
                        <Pill className="h-2.5 w-3/4" />
                        <Pill className="h-2.5 w-1/2" />
                        <Bar className="mt-1 w-2/3" />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <Box className="h-full items-center justify-center py-3">
                        <Bar className="w-1/2" />
                        <Bar className="w-1/3" />
                        <Pill className="mt-1 w-8" />
                    </Box>
                );
            }
            if (variant === 4) {
                return (
                    <div className="flex items-center justify-between gap-2 rounded-sm bg-foreground/5 p-2">
                        <div className="flex flex-col gap-1">
                            <Bar className="w-12" />
                            <Bar className="w-8" />
                        </div>
                        <Pill className="w-7" />
                    </div>
                );
            }
            return (
                <div className="flex h-full flex-col items-center justify-center gap-1.5">
                    <Bar className="w-2/3" />
                    <Bar className="w-1/2" />
                    <Bar className="w-1/3" />
                    <div className="mt-1 flex gap-1.5">
                        <Pill className="w-7" />
                        <Pill className="w-7 bg-foreground/25" />
                    </div>
                </div>
            );

        case 'logos':
            if (variant === 1) {
                return (
                    <div className="flex items-center justify-around gap-1">
                        <Repeat
                            count={4}
                            render={(index) => (
                                <Bar key={index} className="w-6" />
                            )}
                        />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="flex flex-col divide-y divide-foreground/15">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <div key={index} className="py-1">
                                    <Bar className="w-1/2" />
                                </div>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="grid grid-cols-3 gap-1.5">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <Box key={index} className="h-7 items-center">
                                    <Bar className="w-3/4" />
                                </Box>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="flex flex-col items-center gap-2">
                        <Bar className="w-1/3" />
                        <div className="flex gap-2">
                            <Pill className="w-6 bg-foreground/35" />
                            <Pill className="w-8 bg-foreground/45" />
                            <Pill className="w-5 bg-foreground/35" />
                        </div>
                    </div>
                );
            }
            return (
                <div className="grid grid-cols-3 gap-2">
                    <Repeat
                        count={6}
                        render={(index) => (
                            <Bar key={index} className="w-full" />
                        )}
                    />
                </div>
            );

        case 'features':
            if (variant === 1) {
                return (
                    <div className="flex flex-col gap-2">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2"
                                >
                                    <div className="size-3 shrink-0 rounded-sm bg-foreground/25" />
                                    <div className="flex flex-1 flex-col gap-1">
                                        <Bar className="w-2/3" />
                                        <Bar className="w-full" />
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="grid grid-cols-3 gap-2">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <div
                                    key={index}
                                    className="flex flex-col gap-1"
                                >
                                    <div className="size-3 rounded-sm bg-foreground/25" />
                                    <Bar className="w-3/4" />
                                    <Bar className="w-full" />
                                    <Bar className="w-2/3" />
                                </div>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Filled className="h-6 w-1/2" />
                            <div className="flex flex-1 flex-col gap-1">
                                <Bar className="w-full" />
                                <Bar className="w-3/4" />
                            </div>
                        </div>
                        <div className="flex flex-row-reverse items-center gap-2">
                            <Filled className="h-6 w-1/2" />
                            <div className="flex flex-1 flex-col gap-1">
                                <Bar className="w-full" />
                                <Bar className="w-3/4" />
                            </div>
                        </div>
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="grid grid-cols-2 gap-1.5">
                        <Repeat
                            count={4}
                            render={(index) => (
                                <Box key={index} className="h-9">
                                    <Bar className="w-2/3" />
                                    <Bar className="w-full" />
                                </Box>
                            )}
                        />
                    </div>
                );
            }
            return (
                <div className="flex flex-col items-center gap-2">
                    <Bar className="w-1/2" />
                    <Bar className="w-3/4" />
                    <div className="grid w-full grid-cols-3 gap-1.5">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <Box key={index} className="h-10">
                                    <div className="size-2.5 rounded-sm bg-foreground/25" />
                                    <Bar className="w-3/4" />
                                </Box>
                            )}
                        />
                    </div>
                </div>
            );

        case 'stats':
            if (variant === 1) {
                return (
                    <div className="flex items-start justify-around">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center gap-1"
                                >
                                    <Pill className="h-2 w-6" />
                                    <Bar className="w-8" />
                                </div>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="grid grid-cols-2 gap-1.5">
                        <Repeat
                            count={4}
                            render={(index) => (
                                <Filled key={index} className="h-7" />
                            )}
                        />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="grid grid-cols-4 divide-x divide-foreground/15 border-y border-foreground/15 py-2">
                        <Repeat
                            count={4}
                            render={(index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center gap-1 px-0.5"
                                >
                                    <Pill className="h-2 w-5" />
                                    <Bar className="w-full" />
                                </div>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="grid grid-cols-2 gap-3">
                        <Repeat
                            count={2}
                            render={(index) => (
                                <div
                                    key={index}
                                    className="flex flex-col gap-1"
                                >
                                    <Pill className="h-3 w-2/3" />
                                    <Bar className="w-full" />
                                </div>
                            )}
                        />
                    </div>
                );
            }
            return (
                <div className="grid grid-cols-4 gap-1.5">
                    <Repeat
                        count={4}
                        render={(index) => (
                            <Box key={index} className="h-10 items-center">
                                <Pill className="h-2 w-5" />
                                <Bar className="w-3/4" />
                            </Box>
                        )}
                    />
                </div>
            );

        case 'testimonials':
            if (variant === 1) {
                return (
                    <Box className="gap-1.5 p-2">
                        <Pill className="h-2 w-1/3" />
                        <Bar className="w-full" />
                        <Bar className="w-5/6" />
                        <div className="mt-1 flex items-center gap-1.5">
                            <div className="size-3 rounded-full bg-foreground/25" />
                            <Bar className="w-1/3" />
                        </div>
                    </Box>
                );
            }
            if (variant === 2) {
                return (
                    <div className="grid grid-cols-3 gap-1.5">
                        <Box className="h-14 gap-1">
                            <Bar className="w-full" />
                            <Bar className="w-2/3" />
                        </Box>
                        <Box className="h-10 gap-1">
                            <Bar className="w-full" />
                        </Box>
                        <Box className="h-12 gap-1">
                            <Bar className="w-full" />
                            <Bar className="w-3/4" />
                        </Box>
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="flex h-full items-center justify-center">
                        <Box className="w-4/5 items-center gap-1.5 py-2">
                            <Bar className="w-full" />
                            <Bar className="w-2/3" />
                            <div className="size-3 rounded-full bg-foreground/25" />
                        </Box>
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="grid grid-cols-3 gap-2">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <div
                                    key={index}
                                    className="flex flex-col gap-1"
                                >
                                    <Bar className="w-full" />
                                    <Bar className="w-5/6" />
                                    <Bar className="w-2/3" />
                                </div>
                            )}
                        />
                    </div>
                );
            }
            return (
                <div className="grid grid-cols-2 gap-1.5">
                    <Repeat
                        count={2}
                        render={(index) => (
                            <Box key={index} className="h-12 gap-1">
                                <Bar className="w-full" />
                                <Bar className="w-5/6" />
                                <div className="mt-auto size-2.5 rounded-full bg-foreground/25" />
                            </Box>
                        )}
                    />
                </div>
            );

        case 'pricing':
            if (variant === 1) {
                return (
                    <div className="flex flex-col gap-1.5">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <Box
                                    key={index}
                                    className="flex-row items-center justify-between py-1"
                                >
                                    <Bar className="w-1/3" />
                                    <Pill
                                        className={cn(
                                            'w-6',
                                            index === 1 && 'bg-foreground/80',
                                        )}
                                    />
                                </Box>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="flex h-full items-center justify-center">
                        <Box className="w-3/5 items-center gap-1.5 bg-foreground/5 py-2">
                            <Pill className="h-2.5 w-1/2" />
                            <Bar className="w-2/3" />
                            <Pill className="mt-1 w-full" />
                        </Box>
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="grid grid-cols-3 gap-1">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <Box
                                    key={index}
                                    className={cn(
                                        'h-10 items-center',
                                        index === 1 && 'bg-foreground/10',
                                    )}
                                >
                                    <Bar className="w-2/3" />
                                    <Bar className="w-1/2" />
                                </Box>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="grid grid-cols-3 divide-x divide-foreground/15">
                        <Repeat
                            count={3}
                            render={(index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center gap-1 px-1"
                                >
                                    <Bar className="w-2/3" />
                                    <Pill className="h-2 w-5" />
                                    <Bar className="w-full" />
                                    <Bar className="w-3/4" />
                                </div>
                            )}
                        />
                    </div>
                );
            }
            return (
                <div className="grid grid-cols-3 gap-1.5">
                    <Box className="h-14 gap-1">
                        <Bar className="w-2/3" />
                        <Bar className="w-full" />
                        <Bar className="w-3/4" />
                    </Box>
                    <Box className="h-14 gap-1 bg-foreground/80">
                        <Bar className="w-2/3 bg-background/70" />
                        <Bar className="w-full bg-background/50" />
                        <Bar className="w-3/4 bg-background/50" />
                    </Box>
                    <Box className="h-14 gap-1">
                        <Bar className="w-2/3" />
                        <Bar className="w-full" />
                        <Bar className="w-3/4" />
                    </Box>
                </div>
            );

        case 'faq':
            if (variant === 1) {
                return (
                    <div className="flex flex-col gap-2">
                        <Repeat
                            count={4}
                            render={(index) => (
                                <Bar key={index} className="w-full" />
                            )}
                        />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                        <Repeat
                            count={4}
                            render={(index) => (
                                <Bar key={index} className="w-full" />
                            )}
                        />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="grid grid-cols-2 gap-1.5">
                        <Repeat
                            count={4}
                            render={(index) => (
                                <Box key={index} className="h-7 justify-center">
                                    <Bar className="w-3/4" />
                                </Box>
                            )}
                        />
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col justify-center gap-1.5">
                            <Pill className="h-2.5 w-2/3" />
                            <Bar className="w-full" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Repeat
                                count={3}
                                render={(index) => (
                                    <Bar key={index} className="w-full" />
                                )}
                            />
                        </div>
                    </div>
                );
            }
            return (
                <div className="flex flex-col gap-2">
                    <Bar className="mx-auto w-1/3" />
                    <Repeat
                        count={4}
                        render={(index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-2 border-b border-foreground/15 pb-1.5"
                            >
                                <Bar className="w-3/4" />
                                <div className="size-2 rounded-sm bg-foreground/25" />
                            </div>
                        )}
                    />
                </div>
            );

        case 'cta':
            if (variant === 1) {
                return (
                    <Box className="h-full items-center justify-center gap-1.5 border-2">
                        <Bar className="w-1/2" />
                        <Pill className="w-8" />
                    </Box>
                );
            }
            if (variant === 2) {
                return (
                    <div className="flex h-full items-center justify-between gap-2 rounded-sm bg-foreground/10 p-2">
                        <div className="flex flex-col gap-1">
                            <Bar className="w-14" />
                            <Bar className="w-10" />
                        </div>
                        <Pill className="w-7" />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-sm bg-foreground/80 p-2">
                        <Bar className="w-1/2 bg-background/70" />
                        <Bar className="w-1/3 bg-background/50" />
                        <div className="h-2.5 w-8 rounded-sm bg-background" />
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="flex h-full flex-col items-center justify-center gap-1.5">
                        <Bar className="w-1/2" />
                        <Bar className="w-1/3" />
                        <Pill className="h-1.5 w-8 bg-foreground/40" />
                    </div>
                );
            }
            return (
                <div className="flex h-full items-center justify-center rounded-sm bg-foreground/10 p-2">
                    <div className="flex w-full flex-col items-center gap-1.5">
                        <Bar className="w-2/3" />
                        <Pill className="w-10" />
                    </div>
                </div>
            );

        case 'text':
            if (variant === 1) {
                return (
                    <div className="flex flex-col gap-1.5 border-l-2 border-foreground/40 pl-2">
                        <Pill className="h-2 w-1/2" />
                        <Bar className="w-full" />
                        <Bar className="w-full" />
                        <Bar className="w-2/3" />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                            <Pill className="h-2 w-full" />
                            <Bar className="w-full" />
                            <Bar className="w-5/6" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Bar className="w-full" />
                            <Bar className="w-full" />
                            <Bar className="w-2/3" />
                        </div>
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="flex flex-col gap-1.5">
                        <div className="h-4 w-4 rounded-sm bg-foreground/25" />
                        <Pill className="h-2 w-5/6" />
                        <Bar className="w-full" />
                        <Bar className="w-2/3" />
                    </div>
                );
            }
            if (variant === 4) {
                return (
                    <div className="grid grid-cols-[1fr_2fr] gap-2">
                        <Filled className="h-full min-h-8" />
                        <div className="flex flex-col gap-1.5">
                            <Pill className="h-2 w-2/3" />
                            <Bar className="w-full" />
                            <Bar className="w-5/6" />
                        </div>
                    </div>
                );
            }
            return (
                <div className="flex flex-col items-center gap-1.5">
                    <Pill className="h-2 w-2/3" />
                    <Bar className="w-full" />
                    <Bar className="w-5/6" />
                    <Bar className="w-2/3" />
                </div>
            );

        case 'image':
            if (variant === 1) {
                return <Filled className="h-full min-h-10" />;
            }
            if (variant === 2) {
                return (
                    <div className="h-full rounded-sm border border-foreground/15 bg-background p-1.5">
                        <Filled className="h-full" />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="flex h-full flex-col gap-1.5">
                        <Filled className="flex-1" />
                        <Bar className="w-1/2" />
                    </div>
                );
            }
            return <Filled className="h-full min-h-10 rounded-xl" />;

        case 'button':
            if (variant === 1) {
                return (
                    <div className="flex h-full flex-col justify-center gap-1.5">
                        <Pill className="w-12" />
                    </div>
                );
            }
            if (variant === 2) {
                return (
                    <div className="flex h-full flex-col justify-center">
                        <Pill className="h-3 w-full" />
                    </div>
                );
            }
            if (variant === 3) {
                return (
                    <div className="flex h-full items-center justify-center">
                        <Pill className="h-1.5 w-7" />
                    </div>
                );
            }
            return (
                <div className="flex h-full items-center justify-center">
                    <Pill className="w-12" />
                </div>
            );
    }
}

export function BlockMockup({
    type,
    variant = 0,
    className,
}: {
    type: BlockType;
    variant?: number;
    className?: string;
}) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'flex aspect-[4/3] w-full flex-col justify-center overflow-hidden rounded-md border bg-muted/40 p-2.5',
                className,
            )}
        >
            <Skeleton type={type} variant={variant} />
        </div>
    );
}
