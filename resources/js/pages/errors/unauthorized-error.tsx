import { Head } from '@inertiajs/react';
import { GoBack } from '@/components/errors/go-back';
import { useTrans } from '@/hooks/use-trans';

export default function UnauthorizedError() {
    const t = useTrans();

    return (
        <>
            <Head title={t('Unauthorized access')} />
            <div className="h-svh">
                <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                    <h1 className="text-[7rem] leading-tight font-bold">401</h1>
                    <span className="font-medium">
                        {t('Unauthorized access')}
                    </span>
                    <p className="text-center text-muted-foreground">
                        {t('Please sign in with the right account')}
                        <br />
                        {t('to access this page.')}
                    </p>
                    <GoBack />
                </div>
            </div>
        </>
    );
}
