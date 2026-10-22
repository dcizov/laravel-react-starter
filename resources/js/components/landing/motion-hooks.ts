import { useEffect, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);

    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
}

function reducedMotionNow(): boolean {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// True when the visitor asked for less motion. The server renders with motion on, so the first client render matches it.
export function usePrefersReducedMotion(): boolean {
    return useSyncExternalStore(
        subscribeReducedMotion,
        reducedMotionNow,
        () => false,
    );
}

// Becomes true the first time the element is at least `amount` visible, then stays true. Without an
// IntersectionObserver, the element counts as seen straight away, so its content is never left hidden.
export function useInViewOnce<T extends Element>(
    ref: RefObject<T | null>,
    { amount = 0, enabled = true }: { amount?: number; enabled?: boolean } = {},
): boolean {
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!enabled || seen || !element) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            setSeen(true);

            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setSeen(true);
                    observer.disconnect();
                }
            },
            { threshold: amount },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [ref, amount, enabled, seen]);

    return seen;
}
