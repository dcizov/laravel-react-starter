import { router, usePage } from '@inertiajs/react';
import { stop } from '@/actions/App/Http/Controllers/ImpersonationController';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';

// Shown above every page while an administrator is signed in as another user.
// The stop button returns the administrator to their own account.
export function ImpersonationBanner() {
    const t = useTrans();
    const { impersonating } = usePage().props;

    if (!impersonating) {
        return null;
    }

    return (
        <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm"
        >
            <span>
                {t(
                    'You are signed in as :name. Your actions are recorded in the audit log.',
                    {
                        name: impersonating.name,
                    },
                )}
            </span>
            <Button
                size="sm"
                variant="outline"
                onClick={() => router.post(stop.url())}
            >
                {t('Stop impersonating')}
            </Button>
        </div>
    );
}
