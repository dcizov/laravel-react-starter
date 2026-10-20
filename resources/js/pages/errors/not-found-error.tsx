import { Head } from '@inertiajs/react';
import { GoBack } from '@/components/errors/go-back';
import { useTrans } from '@/hooks/use-trans';

export default function NotFoundError() {
    const t = useTrans();

    return (
        <>
            <Head title={t('Page not found')} />
            <div className="h-svh">
                <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                    <h1 className="text-[7rem] leading-tight font-bold">404</h1>
                    <span className="font-medium">
                        {t('Oops! Page not found!')}
                    </span>
                    <p className="text-center text-muted-foreground">
                        {t('The page you are looking for does not exist')}
                        <br />
                        {t('or might have been removed.')}
                    </p>
                    <GoBack />
                </div>
            </div>
        </>
    );
}
