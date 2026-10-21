import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginatorLink } from '@/types/cms';

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
                        key={index}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        nativeButton={false}
                        render={<Link href={link.url} preserveScroll />}
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    </Button>
                ) : (
                    <span
                        key={index}
                        className="px-3 py-1.5 text-sm text-muted-foreground"
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    </span>
                ),
            )}
        </nav>
    );
}
