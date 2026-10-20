import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// Skeletons only show when a page takes longer than this. Most navigations finish
// sooner (especially prefetched ones), and a flash of skeleton is worse than a short wait.
const SKELETON_DELAY_MS = 300;

// True while a GET page visit is slow enough to deserve a skeleton. Form saves use
// PATCH or POST and keep the current page on screen, so they do not count.
export function usePageNavigation(): boolean {
    const [navigating, setNavigating] = useState(false);

    useEffect(() => {
        let timer: number | undefined;

        const offStart = router.on('start', (event) => {
            if (event.detail.visit.method !== 'get') {
                return;
            }

            window.clearTimeout(timer);
            timer = window.setTimeout(
                () => setNavigating(true),
                SKELETON_DELAY_MS,
            );
        });

        const offFinish = router.on('finish', () => {
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
