import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// Skeletons only show when a page takes longer than this. Most navigations finish
// sooner, and a flash of skeleton is worse than a short wait.
const SKELETON_DELAY_MS = 300;

// True while a visit to a different page is slow enough to deserve a skeleton.
// Ignored: prefetches (hovering a link), reloads of the page on screen, and form
// saves (PATCH or POST). Those keep the current page mounted, so its state survives.
export function usePageNavigation(): boolean {
    const [navigating, setNavigating] = useState(false);

    useEffect(() => {
        let timer: number | undefined;
        let pendingUrl: string | null = null;

        const isPageChange = (visit: {
            method: string;
            prefetch?: boolean;
            url: URL | string;
        }) => {
            if (visit.method !== 'get' || visit.prefetch) {
                return false;
            }

            const target = new URL(String(visit.url), window.location.href);

            return target.pathname !== window.location.pathname;
        };

        const offStart = router.on('start', (event) => {
            const visit = event.detail.visit;

            if (!isPageChange(visit)) {
                return;
            }

            pendingUrl = String(visit.url);
            window.clearTimeout(timer);
            timer = window.setTimeout(
                () => setNavigating(true),
                SKELETON_DELAY_MS,
            );
        });

        const offFinish = router.on('finish', (event) => {
            // Only the real page visit we started clears the skeleton; prefetches never set it.
            if (pendingUrl === null || event.detail.visit.prefetch) {
                return;
            }

            pendingUrl = null;
            window.clearTimeout(timer);
            setNavigating(false);
        });

        return () => {
            window.clearTimeout(timer);
            offStart();
            offFinish();
        };
    }, []);

    return navigating;
}
