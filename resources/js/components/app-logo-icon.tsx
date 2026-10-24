import type { SVGAttributes } from 'react';

/**
 * Lattice mark: four interlocking cells that read as a woven grid.
 * Kept as an inline SVG so it can be themed with `currentColor`.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path d="M4 4h6v6H4z" />
            <path d="M14 4h6v6h-6z" />
            <path d="M4 14h6v6H4z" />
            <path d="M14 14h6v6h-6z" />
            <path d="M10 7h4M7 10v4M17 10v4M10 17h4" opacity={0.45} />
        </svg>
    );
}
