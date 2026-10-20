import { Head } from '@inertiajs/react';
import { useTrans } from '@/hooks/use-trans';

export default function MaintenanceError() {
    const t = useTrans();

    return (
        <>
            <Head title={t('Under maintenance')} />
            <div className="h-svh">
                <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                    <h1 className="text-[7rem] leading-tight font-bold">503</h1>
                    <span className="font-medium">
                        {t('The app is under maintenance.')}
                    </span>
                    <p className="text-center text-muted-foreground">
                        {t('The app is not available at the moment.')}
                        <br />
                        {t("We'll be back online shortly.")}
                    </p>
                </div>
            </div>
        </>
    );
}
