import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

// Shows the toast a controller flashed with Inertia::flash('toast', ...).
// Types render their own icon; an optional action opens a page in the app.
export function useFlashToast(): void {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            const options = {
                description: data.description,
                action: data.action
                    ? {
                          label: data.action.label,
                          onClick: () => router.visit(data.action!.url),
                      }
                    : undefined,
            };

            switch (data.type) {
                case 'success':
                    toast.success(data.message, options);
                    break;
                case 'info':
                    toast.info(data.message, options);
                    break;
                case 'warning':
                    toast.warning(data.message, options);
                    break;
                case 'error':
                    toast.error(data.message, options);
                    break;
                case 'loading':
                    toast.loading(data.message, options);
                    break;
            }
        });
    }, []);
}
