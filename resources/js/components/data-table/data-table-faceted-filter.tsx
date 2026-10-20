import type { Column, RowData } from '@tanstack/react-table';
import { CirclePlus } from 'lucide-react';
import * as React from 'react';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useTrans } from '@/hooks/use-trans';

export type FacetOption = {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
};

// A dashed filter button with a searchable list of options. Shows how many rows each option has.
export function DataTableFacetedFilter<TData extends RowData, TValue>({
    column,
    title,
    options,
    selectedValues,
}: {
    column?: Column<DataTableFeatures, TData, TValue>;
    title: string;
    options: FacetOption[];
    // The filter values from the table state. Passed in so the list always matches the table.
    selectedValues?: string[];
}) {
    const t = useTrans();
    const facets = column?.getFacetedUniqueValues();
    const selected = new Set<string>(selectedValues ?? []);

    const toggle = (value: string) => {
        const next = new Set(selected);

        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }

        column?.setFilterValue(next.size ? Array.from(next) : undefined);
    };

    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed"
                    />
                }
            >
                <CirclePlus />
                {title}
                {selected.size > 0 && (
                    <>
                        <Separator
                            orientation="vertical"
                            className="mx-2 h-4"
                        />
                        <Badge
                            variant="secondary"
                            className="rounded-sm px-1 font-normal lg:hidden"
                        >
                            {selected.size}
                        </Badge>
                        <div className="hidden gap-1 lg:flex">
                            {selected.size > 2 ? (
                                <Badge
                                    variant="secondary"
                                    className="rounded-sm px-1 font-normal"
                                >
                                    {t(':count selected', {
                                        count: selected.size,
                                    })}
                                </Badge>
                            ) : (
                                options
                                    .filter((option) =>
                                        selected.has(option.value),
                                    )
                                    .map((option) => (
                                        <Badge
                                            key={option.value}
                                            variant="secondary"
                                            className="rounded-sm px-1 font-normal"
                                        >
                                            {option.label}
                                        </Badge>
                                    ))
                            )}
                        </div>
                    </>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>
                            <Empty className="p-4">
                                <EmptyHeader>
                                    <EmptyTitle>
                                        {t('No results found')}
                                    </EmptyTitle>
                                </EmptyHeader>
                            </Empty>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selected.has(option.value);

                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => toggle(option.value)}
                                    >
                                        {/* The row is the click target; the checkbox only shows state. */}
                                        <Checkbox
                                            checked={isSelected}
                                            tabIndex={-1}
                                            aria-hidden="true"
                                            className="pointer-events-none"
                                        />
                                        {option.icon && (
                                            <option.icon className="size-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                        {facets?.get(option.value) && (
                                            <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs text-muted-foreground">
                                                {facets.get(option.value)}
                                            </span>
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selected.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() =>
                                            column?.setFilterValue(undefined)
                                        }
                                        className="justify-center text-center"
                                    >
                                        {t('Clear filters')}
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
