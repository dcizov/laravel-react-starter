import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';
import type { FlashToast } from '@/types/ui';

// Shows the toast a controller flashed with Inertia::flash('toast', ...).
// The type picks the icon; an optional action opens a page in the app.
export function useFlashToast(): void {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            const url = data.action?.url;

            toast.add({
                type: data.type,
                title: data.message,
                description: data.description,
                // Loading toasts stay until something replaces or closes them.
                ...(data.type === 'loading' ? { timeout: 0 } : {}),
                actionProps: data.action
                    ? {
                          children: data.action.label,
                          onClick: () => {
                              if (url) {
                                  router.visit(url);
                              }
                          },
                      }
                    : undefined,
            });
        });
    }, []);
}
