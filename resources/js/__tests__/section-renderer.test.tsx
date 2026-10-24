import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionRenderer } from '@/components/sections/section-renderer';

describe('SectionRenderer', () => {
    it('renders nothing for a disabled block', () => {
        const { container } = render(
            <SectionRenderer
                block={{
                    id: 'a',
                    section: 'hero',
                    enabled: false,
                    content: { heading: 'Hidden' },
                }}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the hero heading from block content', () => {
        render(
            <SectionRenderer
                block={{
                    id: 'a',
                    section: 'hero',
                    enabled: true,
                    content: {
                        heading: 'Lattice ships',
                        body: 'A self-hosted CMS',
                    },
                }}
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Lattice ships' }),
        ).toBeInTheDocument();
        expect(screen.getByText('A self-hosted CMS')).toBeInTheDocument();
    });

    it('drops an authored link whose scheme is executable', () => {
        const { container } = render(
            <SectionRenderer
                block={{
                    id: 'a',
                    section: 'hero',
                    enabled: true,
                    content: {
                        heading: 'Unsafe',
                        cta_label: 'Click',
                        cta_url: 'javascript:alert(1)',
                    },
                }}
            />,
        );

        // The link is refused outright: no anchor at all, rather than an anchor
        // whose href was rewritten to something misleading.
        expect(container.querySelector('a')).toBeNull();
        expect(screen.queryByText('Click')).not.toBeInTheDocument();
    });
});
