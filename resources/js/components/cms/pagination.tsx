import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginatorLink } from '@/types/cms';

// Laravel labels can contain HTML entities such as &laquo;. Decode them to plain text
// (DOMParser never runs scripts, and only textContent is read) so labels are never inserted as HTML.
function plainLabel(label: string): string {
    return (
        new DOMParser().parseFromString(label, 'text/html').body.textContent ??
        ''
    );
}

// Previous and next links from Laravel's paginator. Labels come from the server, which already translates them.
export default function Pagination({ links }: { links: PaginatorLink[] }) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <nav
            aria-label="Pagination"
            className="mt-8 flex flex-wrap justify-center gap-2"
        >
            {links.map((link, index) =>
                link.url ? (
                    <Button
                        // Paginator links are a static list for each page, so the position is a stable key.
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        nativeButton={false}
                        render={<Link href={link.url} preserveScroll />}
                    >
                        {plainLabel(link.label)}
                    </Button>
                ) : (
                    <span
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className="px-3 py-1.5 text-sm text-muted-foreground"
                    >
                        {plainLabel(link.label)}
                    </span>
                ),
            )}
        </nav>
    );
}
