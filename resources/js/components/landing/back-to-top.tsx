import { ArrowUp } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// How far the visitor must scroll before the button appears.
const SHOW_AFTER_PX = 400;

// The scroll position is an external store: subscribe to the scroll event and read window.scrollY.
// Defined outside the component so the subscription is not recreated on every render.
function subscribeToScroll(onChange: () => void): () => void {
    window.addEventListener('scroll', onChange, { passive: true });

    return () => window.removeEventListener('scroll', onChange);
}

function isScrolledDown(): boolean {
    return window.scrollY > SHOW_AFTER_PX;
}

// Hidden on the server, where there is no window. In the browser the real position is read at once,
// so a reloaded page scrolled down still shows the button.
function notScrolledOnServer(): boolean {
    return false;
}

// A fixed button that scrolls the landing page back to the top.
export function BackToTop() {
    const t = useTrans();
    const visible = useSyncExternalStore(
        subscribeToScroll,
        isScrolledDown,
        notScrolledOnServer,
    );

    return (
        <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={t('Back to top')}
            title={t('Back to top')}
            onClick={() =>
                window.scrollTo({ top: 0, behavior: scrollBehavior() })
            }
            className={cn(
                'fixed right-4 bottom-4 z-40 rounded-full shadow-md transition-all duration-300 md:right-6 md:bottom-6',
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-4 opacity-0',
            )}
        >
            <ArrowUp />
        </Button>
    );
}

// Smooth scrolling unless the visitor asked for reduced motion.
export function scrollBehavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';
}
