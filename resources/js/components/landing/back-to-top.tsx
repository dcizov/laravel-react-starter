import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// How far the visitor must scroll before the button appears.
const SHOW_AFTER_PX = 400;

// A fixed button that scrolls the landing page back to the top.
export function BackToTop() {
    const t = useTrans();
    // Hidden on the server, where there is no window. The effect reads the position once the page is in the browser,
    // so a reloaded page scrolled down still shows the button.
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const update = () => setVisible(window.scrollY > SHOW_AFTER_PX);

        update();

        window.addEventListener('scroll', update, { passive: true });

        return () => window.removeEventListener('scroll', update);
    }, []);

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
