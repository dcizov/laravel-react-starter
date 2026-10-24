import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '@/components/confirm-dialog';

function open(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
        <ConfirmDialog
            open
            onOpenChange={onOpenChange}
            title="Delete “Home”?"
            description="This cannot be undone."
            confirmLabel="Delete page"
            onConfirm={onConfirm}
            {...props}
        />,
    );

    return { onConfirm, onOpenChange };
}

describe('ConfirmDialog', () => {
    it('renders nothing until it is opened', () => {
        render(
            <ConfirmDialog
                open={false}
                onOpenChange={vi.fn()}
                title="Delete"
                description="No."
                onConfirm={vi.fn()}
            />,
        );

        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('confirms only when the destructive button is pressed', async () => {
        const user = userEvent.setup();
        const { onConfirm } = open();

        await user.click(screen.getByRole('button', { name: 'Delete page' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('cancels without confirming', async () => {
        const user = userEvent.setup();
        const { onConfirm, onOpenChange } = open();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('puts the safe action under the keyboard when it opens', async () => {
        open();

        // Radix moves focus into the dialog; Enter must not destroy anything.
        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Cancel' }),
            ).toHaveFocus();
        });
    });

    it('closes on Escape without confirming', async () => {
        const user = userEvent.setup();
        const { onConfirm, onOpenChange } = open();

        await user.keyboard('{Escape}');

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
