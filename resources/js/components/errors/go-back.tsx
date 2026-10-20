import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';
import { home } from '@/routes';

// The two actions on every error page: step back, or go to the start page.
export function GoBack() {
    const t = useTrans();

    return (
        <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
                {t('Go back')}
            </Button>
            <Button onClick={() => router.visit(home())}>
                {t('Back to home')}
            </Button>
        </div>
    );
}
