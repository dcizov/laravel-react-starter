import { Head } from '@inertiajs/react';
import { GoBack } from '@/components/errors/go-back';
import { useTrans } from '@/hooks/use-trans';

export default function ForbiddenError() {
    const t = useTrans();

    return (
        <>
            <Head title={t('Access forbidden')} />
            <div className="h-svh">
                <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                    <h1 className="text-[7rem] leading-tight font-bold">403</h1>
                    <span className="font-medium">{t('Access forbidden')}</span>
                    <p className="text-center text-muted-foreground">
                        {t("You don't have the permission")}
                        <br />
                        {t('to view this page.')}
                    </p>
                    <GoBack />
                </div>
            </div>
        </>
    );
}
