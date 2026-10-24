import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '@/components/status-badge';

describe('StatusBadge', () => {
    it.each([
        ['draft', 'Draft'],
        ['scheduled', 'Scheduled'],
        ['published', 'Published'],
        ['error', 'Error'],
    ] as const)('labels %s as %s', (status, label) => {
        render(<StatusBadge status={status} />);

        expect(screen.getByText(label)).toBeInTheDocument();
    });

    it('exposes the status to assistive technology as text, not colour alone', () => {
        render(<StatusBadge status="published" />);

        expect(screen.getByText('Published')).toBeVisible();
    });
});
