import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// True while the browser is loading a new page with a GET visit (a link or a visit).
// Form saves use PATCH or POST and keep the current page on screen, so they do not count.
export function usePageNavigation(): boolean {
    const [navigating, setNavigating] = useState(false);

    useEffect(() => {
        const offStart = router.on('start', (event) => {
            if (event.detail.visit.method === 'get') {
                setNavigating(true);
            }
        });
        const offFinish = router.on('finish', () => setNavigating(false));

        return () => {
            offStart();
            offFinish();
        };
    }, []);

    return navigating;
}
