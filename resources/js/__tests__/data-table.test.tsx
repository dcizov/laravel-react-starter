import { createColumnHelper } from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
    DataTable,
    DataTableColumnHeader,
    DataTableSortButton,
    DataTableToolbar,
} from '@/components/data-table';
import type { DataTableFeatures } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';

type Person = {
    id: number;
    name: string;
    role: string;
};

const columnHelper = createColumnHelper<DataTableFeatures, Person>();

const columns = columnHelper.columns([
    columnHelper.accessor('name', {
        header: 'Name',
        meta: { label: 'Name' },
        cell: ({ row }) => row.original.name,
    }),
    columnHelper.accessor('role', {
        header: 'Role',
        meta: { label: 'Role' },
        cell: ({ row }) => row.original.role,
    }),
]);

const sortableColumns = columnHelper.columns([
    columnHelper.accessor('name', {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => row.original.name,
    }),
    columnHelper.accessor('role', {
        header: 'Role',
        cell: ({ row }) => row.original.role,
    }),
]);

const people: Person[] = [
    { id: 1, name: 'Ada', role: 'admin' },
    { id: 2, name: 'Grace', role: 'editor' },
    { id: 3, name: 'Linus', role: 'author' },
];

function manyPeople(count: number): Person[] {
    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        name: `Person ${index + 1}`,
        role: 'author',
    }));
}

const getRowId = (person: Person) => String(person.id);

describe('DataTable', () => {
    it('renders every row and the header labels', () => {
        render(
            <DataTable
                columns={columns}
                data={people}
                getRowId={getRowId}
                paginate={false}
            />,
        );

        expect(
            screen.getByRole('columnheader', { name: 'Name' }),
        ).toBeVisible();
        expect(screen.getByText('Ada')).toBeVisible();
        expect(screen.getByText('Linus')).toBeVisible();
        expect(screen.getAllByRole('row')).toHaveLength(people.length + 1);
    });

    it('renders the caller supplied empty state instead of an empty grid', () => {
        render(
            <DataTable
                columns={columns}
                data={[]}
                getRowId={getRowId}
                emptyState={
                    <EmptyState
                        title="No people yet"
                        description="Invite a teammate to get started."
                    />
                }
            />,
        );

        expect(screen.getByText('No people yet')).toBeVisible();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('turns a server error into a retryable alert', async () => {
        const onRetry = vi.fn();

        render(
            <DataTable
                columns={columns}
                data={[]}
                getRowId={getRowId}
                error="The list could not be loaded."
                onRetry={onRetry}
            />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent(
            'The list could not be loaded.',
        );

        await userEvent.click(screen.getByRole('button', { name: /retry/i }));

        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('keeps the header visible while loading and renders skeleton cells', () => {
        const { container } = render(
            <DataTable
                columns={columns}
                data={[]}
                getRowId={getRowId}
                loading
                skeletonRows={2}
            />,
        );

        expect(
            screen.getByRole('columnheader', { name: 'Name' }),
        ).toBeVisible();
        expect(
            container.querySelectorAll('[data-slot="skeleton"]'),
        ).toHaveLength(4);
    });

    it('paginates client data and reports the current page', async () => {
        render(
            <DataTable
                columns={columns}
                data={manyPeople(25)}
                getRowId={getRowId}
                initialPageSize={10}
            />,
        );

        expect(screen.getByText('Page 1 of 3')).toBeVisible();
        expect(screen.getByText('Person 1')).toBeVisible();
        expect(screen.queryByText('Person 11')).not.toBeInTheDocument();

        await userEvent.click(
            screen.getByRole('button', { name: /go to next page/i }),
        );

        expect(screen.getByText('Page 2 of 3')).toBeVisible();
        expect(screen.getByText('Person 11')).toBeVisible();
    });

    it('leaves paging to the server and asks the page for the next offset', async () => {
        const onPageChange = vi.fn();

        render(
            <DataTable
                columns={columns}
                data={people}
                getRowId={getRowId}
                serverPagination={{
                    pageIndex: 1,
                    pageSize: 20,
                    pageCount: 5,
                    total: 100,
                }}
                onPageChange={onPageChange}
            />,
        );

        expect(screen.getByText('Page 2 of 5')).toBeVisible();
        expect(screen.getByText('100 rows')).toBeVisible();
        // The page size is owned by the controller, so no selector is offered.
        expect(
            screen.queryByRole('combobox', { name: /rows per page/i }),
        ).not.toBeInTheDocument();

        await userEvent.click(
            screen.getByRole('button', { name: /go to next page/i }),
        );

        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('sorts client data from the column header menu', async () => {
        render(
            <DataTable
                columns={sortableColumns}
                data={people}
                getRowId={getRowId}
                paginate={false}
            />,
        );

        const firstColumn = () =>
            screen
                .getAllByRole('row')
                .slice(1)
                .map((row) => within(row).getAllByRole('cell')[0].textContent);

        expect(firstColumn()).toEqual(['Ada', 'Grace', 'Linus']);

        await userEvent.click(screen.getByRole('button', { name: 'Name' }));
        await userEvent.click(
            screen.getByRole('menuitem', { name: /descending/i }),
        );

        expect(firstColumn()).toEqual(['Linus', 'Grace', 'Ada']);
    });

    it('hides a column from the visibility menu', async () => {
        render(
            <DataTable
                columns={columns}
                data={people}
                getRowId={getRowId}
                paginate={false}
                toolbar={
                    <DataTableToolbar
                        filters={
                            <DataTableSortButton
                                label="Name"
                                active={false}
                                direction="asc"
                                onSort={() => {}}
                            />
                        }
                    />
                }
            />,
        );

        expect(screen.getByText('editor')).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /columns/i }));

        const menu = screen.getByRole('menu');
        await userEvent.click(within(menu).getByText('Role'));

        expect(screen.queryByText('editor')).not.toBeInTheDocument();
    });
});
