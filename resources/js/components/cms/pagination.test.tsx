import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Pagination from '@/components/cms/pagination';

vi.mock('@inertiajs/react', () => ({
    Link: ({
        href,
        children,
        ...rest
    }: {
        href: string;
        children: React.ReactNode;
    }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

describe('Pagination', () => {
    afterEach(() => {
        cleanup();
    });

    it('shows Laravel labels as text, decoding entities', () => {
        const { container } = render(
            <Pagination
                links={[
                    { url: null, label: '&laquo; Previous', active: false },
                    { url: '/?page=1', label: '1', active: true },
                    { url: '/?page=2', label: '2', active: false },
                    { url: '/?page=2', label: 'Next &raquo;', active: false },
                ]}
            />,
        );

        expect(container.textContent).toContain('« Previous');
        expect(container.textContent).toContain('Next »');
    });

    it('never injects label markup as HTML', () => {
        const { container } = render(
            <Pagination
                links={[
                    {
                        url: null,
                        label: '<img src="x" onerror="alert(1)">',
                        active: false,
                    },
                    { url: '/?page=1', label: '1', active: true },
                    { url: '/?page=2', label: '2', active: false },
                    { url: '/?page=3', label: '3', active: false },
                ]}
            />,
        );

        // The markup is parsed as inert HTML and only its text is shown, so no element is created.
        expect(container.querySelector('img')).toBeNull();
        expect(container.textContent).not.toContain('onerror');
    });

    it('renders nothing when there is only one page', () => {
        const { container } = render(
            <Pagination
                links={[
                    { url: null, label: '&laquo; Previous', active: false },
                    { url: null, label: '1', active: true },
                    { url: null, label: 'Next &raquo;', active: false },
                ]}
            />,
        );

        expect(container.querySelector('nav')).toBeNull();
    });
});
