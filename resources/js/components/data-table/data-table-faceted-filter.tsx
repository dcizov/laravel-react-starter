import type { Column, RowData } from '@tanstack/react-table';
import { Check, CirclePlus } from 'lucide-react';
import * as React from 'react';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

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
}: {
    column?: Column<DataTableFeatures, TData, TValue>;
    title: string;
    options: FacetOption[];
}) {
    const t = useTrans();
    const facets = column?.getFacetedUniqueValues();
    const filterValue = column?.getFilterValue();
    const selected = new Set<string>(
        Array.isArray(filterValue) ? (filterValue as string[]) : [],
    );

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
                        className="h-8 border-dashed"
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
                        <CommandEmpty>{t('No results found.')}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selected.has(option.value);

                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => toggle(option.value)}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-4 items-center justify-center rounded-[4px] border',
                                                isSelected
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-input [&_svg]:invisible',
                                            )}
                                        >
                                            <Check className="size-3.5" />
                                        </div>
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
