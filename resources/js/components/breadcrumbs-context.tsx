import {
    createContext,
    use,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { BreadcrumbItem } from '@/types';

type BreadcrumbsContextValue = {
    items: BreadcrumbItem[];
    setItems: (items: BreadcrumbItem[]) => void;
};

const BreadcrumbsContext = createContext<BreadcrumbsContextValue | null>(null);

/**
 * Holds the breadcrumb trail for the admin shell.
 *
 * The shell is a persistent Inertia layout: it survives navigation between
 * admin pages, so it cannot receive breadcrumbs as props. Pages publish their
 * trail here instead, which keeps the layout mounted (no sidebar remount, no
 * lost scroll state) while the trail still follows the page.
 */
export function BreadcrumbsProvider({ children }: PropsWithChildren) {
    const [items, setItems] = useState<BreadcrumbItem[]>([]);

    const value = useMemo(() => ({ items, setItems }), [items]);

    return <BreadcrumbsContext value={value}>{children}</BreadcrumbsContext>;
}

/**
 * Publishes the trail for the current page. Call it from the page component
 * itself, before rendering.
 */
export function useBreadcrumbs(items: BreadcrumbItem[]): void {
    const context = use(BreadcrumbsContext);
    const latestRef = useRef(items);
    const key = JSON.stringify(items);

    latestRef.current = items;

    useEffect(() => {
        context?.setItems(latestRef.current);
    }, [key, context]);
}

/** The trail published by the page that is currently rendered. */
export function useBreadcrumbItems(): BreadcrumbItem[] {
    return use(BreadcrumbsContext)?.items ?? [];
}
