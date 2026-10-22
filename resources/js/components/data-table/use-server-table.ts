import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import type { DataTableServerState } from '@/components/data-table/data-table';
import { useTrans } from '@/hooks/use-trans';

// The query of a server-mode DataTable, as the page receives it. Keys are the names used in the URL.
export type ServerTableQuery = {
    q: string;
    sort: string | null;
    direction: 'asc' | 'desc';
    page: number;
    per_page: number;
    // Facet filters, one key per column: ?status=draft,published
    [filter: string]: string | number | string[] | null;
};

// Keeps a server-mode table in the URL. Each change is a visit that replaces the history entry (so the back button
// goes to the previous page, not to every keystroke), keeps the scroll position, and reloads only the listed props.
// It also reports loading and failed loads, so the table can show a skeleton or a retry button.
export function useServerTable<Q extends ServerTableQuery>({
    url,
    query,
    only,
    filterKeys,
}: {
    url: string;
    query: Q;
    only: string[];
    // The query keys that hold facet filters, so the table can send them as lists.
    filterKeys: string[];
}): {
    // Builds the DataTable's server props from the rows the server counted for this query.
    serverState: (counts: {
        total: number;
        pageCount: number;
        perPage: number;
    }) => DataTableServerState;
    // Sends a new query (for example a status tab) to the server, with the rest of the query kept.
    visit: (next: Record<string, unknown>) => void;
} {
    const t = useTrans();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const path = new URL(url, window.location.href).pathname;

    useEffect(() => {
        // Set while a visit to this table is in flight. Events of other visits are ignored.
        let inFlight = false;
        const failed = () => {
            if (inFlight) {
                setError(
                    t(
                        'The server did not return the list. Check your connection and try again.',
                    ),
                );
            }
        };

        const offStart = router.on('start', (event) => {
            inFlight =
                new URL(String(event.detail.visit.url), window.location.href)
                    .pathname === path;

            if (inFlight) {
                setLoading(true);
            }
        });
        const offFinish = router.on('finish', () => {
            if (inFlight) {
                inFlight = false;
                setLoading(false);
            }
        });
        const offSuccess = router.on('success', () => {
            if (inFlight) {
                setError(null);
            }
        });
        const offError = router.on('error', failed);
        const offNetwork = router.on('networkError', failed);

        return () => {
            offStart();
            offFinish();
            offSuccess();
            offError();
            offNetwork();
        };
    }, [path, t]);

    const visit = useCallback(
        (next: Record<string, unknown>) => {
            const merged: Record<string, unknown> = { ...query, ...next };

            // Empty values are left out of the URL, so the default list has a clean address.
            const params = Object.fromEntries(
                Object.entries(merged).filter(([, value]) => {
                    if (value === null || value === undefined || value === '') {
                        return false;
                    }

                    return !(Array.isArray(value) && value.length === 0);
                }),
            );

            router.get(url, params as Record<string, string>, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only,
            });
        },
        [query, url, only],
    );

    return {
        serverState: ({ total, pageCount, perPage }) => ({
            total,
            pageCount,
            page: query.page,
            perPage,
            sort: query.sort,
            direction: query.direction,
            search: query.q,
            filters: Object.fromEntries(
                filterKeys.map((key) => {
                    const value = query[key];

                    return [
                        key,
                        Array.isArray(value)
                            ? value
                            : typeof value === 'string' && value !== ''
                              ? value.split(',')
                              : [],
                    ];
                }),
            ),
            loading,
            error,
            onRetry: () => {
                setError(null);
                visit({});
            },
            onChange: (patch) => {
                const { filters, ...rest } = patch;
                const flat: Record<string, unknown> = { ...rest };

                if (filters) {
                    filterKeys.forEach((key) => {
                        flat[key] = filters[key]?.join(',') ?? null;
                    });
                }

                if ('search' in rest) {
                    flat.q = rest.search;
                    delete flat.search;
                }

                if ('perPage' in rest) {
                    flat.per_page = rest.perPage;
                    delete flat.perPage;
                }

                if ('page' in rest) {
                    flat.page = rest.page;
                }

                if ('sort' in rest) {
                    flat.sort = rest.sort;
                }

                visit(flat);
            },
        }),
        visit,
    };
}
